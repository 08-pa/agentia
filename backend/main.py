from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

from core.config import settings
from core.security import create_access_token, decode_access_token
from core.redis_client import blacklist_token, is_token_blacklisted, ping as redis_ping
from models.database import ReportModel, UserModel, HistoryModel, ensure_indexes, _client as mongo_client
from workflow import ResearchWorkflow

app = FastAPI(title="Agentia - AI Research API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
workflow = ResearchWorkflow()


@app.on_event("startup")
async def on_startup():
    await ensure_indexes()


# ============ MODELS ============

class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ResearchRequest(BaseModel):
    query: str = Field(min_length=3)


class ResearchResponse(BaseModel):
    query: str
    report: str
    subtopics: List[str]
    report_id: str
    cached: bool = False


class SaveReportRequest(BaseModel):
    report_id: str


# ============ AUTH DEPENDENCY ============

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if not payload:
        raise credentials_error

    jti = payload.get("jti")
    if jti and await is_token_blacklisted(jti):
        raise HTTPException(status_code=401, detail="Session has been logged out")

    user_id = payload.get("sub")
    user = await UserModel.get_user_by_id(user_id) if user_id else None
    if not user:
        raise credentials_error

    return user


# ============ AUTH ENDPOINTS ============

@app.post("/auth/signup", response_model=AuthResponse)
async def signup(user: UserCreate):
    """Register a new user and log them in immediately."""
    user_id, error = await UserModel.create_user(user.model_dump())
    if error:
        raise HTTPException(status_code=400, detail=error)

    token, _, _ = create_access_token(user_id)
    return AuthResponse(
        access_token=token,
        user={"user_id": user_id, "username": user.username, "email": user.email},
    )


@app.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    """Login user"""
    user_data, error = await UserModel.authenticate_user(credentials.email, credentials.password)
    if error:
        raise HTTPException(status_code=401, detail=error)

    token, _, _ = create_access_token(user_data["user_id"])
    return AuthResponse(access_token=token, user=user_data)


@app.post("/auth/logout")
async def logout(token: str = Depends(oauth2_scheme), current_user: dict = Depends(get_current_user)):
    """Invalidate the current access token."""
    payload = decode_access_token(token)
    jti = payload.get("jti")
    exp = payload.get("exp")
    if jti and exp:
        await blacklist_token(jti, datetime.fromtimestamp(exp, tz=timezone.utc))
    return {"message": "Logged out successfully"}


@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}


# ============ RESEARCH ENDPOINTS ============

@app.post("/research", response_model=ResearchResponse)
async def research(request: ResearchRequest, current_user: dict = Depends(get_current_user)):
    """Run the Plan -> Gather -> Synthesize pipeline (Redis-cached for repeat queries)."""
    user_id = current_user["user_id"]
    result = await workflow.run(request.query)

    report_id = await ReportModel.create_report({
        "query": result["query"],
        "report": result["report"],
        "subtopics": result["subtopics"],
        "user_id": user_id,
        "cached": result.get("cached", False),
    })

    await HistoryModel.add_history(user_id, result["query"])

    return ResearchResponse(
        query=result["query"],
        report=result["report"],
        subtopics=result["subtopics"],
        report_id=report_id,
        cached=result.get("cached", False),
    )


@app.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    reports = await ReportModel.get_user_reports(current_user["user_id"])
    return {"reports": reports}


@app.get("/reports/saved")
async def get_saved_reports(current_user: dict = Depends(get_current_user)):
    reports = await ReportModel.get_saved_reports(current_user["user_id"])
    return {"reports": reports}


@app.get("/reports/{report_id}")
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    report = await ReportModel.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return report


@app.post("/reports/save")
async def save_report(request: SaveReportRequest, current_user: dict = Depends(get_current_user)):
    ok = await ReportModel.save_report(request.report_id, current_user["user_id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "message": "Report saved!"}


@app.get("/users/me/history")
async def get_my_history(current_user: dict = Depends(get_current_user)):
    history = await HistoryModel.get_user_history(current_user["user_id"])
    return {"history": history}


# ============ HEALTH ============

@app.get("/")
async def health_check():
    redis_ok = await redis_ping()
    try:
        await mongo_client.admin.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False

    return {
        "status": "healthy" if redis_ok and mongo_ok else "degraded",
        "service": "Agentia API",
        "mongo": mongo_ok,
        "redis": redis_ok,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
