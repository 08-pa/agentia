from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorClient

from core.config import settings
from core.security import hash_password, verify_password

_client = AsyncIOMotorClient(settings.MONGO_URI)
db = _client[settings.MONGO_DB_NAME]

users_col = db["users"]
reports_col = db["reports"]
history_col = db["history"]


async def ensure_indexes() -> None:
    await users_col.create_index("email", unique=True)
    await reports_col.create_index("user_id")
    await history_col.create_index([("user_id", 1), ("timestamp", -1)])


def _oid(id_str: str) -> ObjectId | None:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        return None


def _public_user(doc: dict) -> dict:
    return {
        "user_id": str(doc["_id"]),
        "username": doc.get("username", ""),
        "email": doc.get("email", ""),
    }


class UserModel:
    @staticmethod
    async def create_user(data: dict) -> tuple[str | None, str | None]:
        existing = await users_col.find_one({"email": data["email"]})
        if existing:
            return None, "An account with this email already exists"

        doc = {
            "username": data["username"],
            "email": data["email"],
            "password_hash": hash_password(data["password"]),
            "created_at": datetime.now(timezone.utc),
        }
        result = await users_col.insert_one(doc)
        return str(result.inserted_id), None

    @staticmethod
    async def authenticate_user(email: str, password: str) -> tuple[dict | None, str | None]:
        doc = await users_col.find_one({"email": email})
        if not doc or not verify_password(password, doc["password_hash"]):
            return None, "Invalid email or password"
        return _public_user(doc), None

    @staticmethod
    async def get_user_by_id(user_id: str) -> dict | None:
        oid = _oid(user_id)
        if not oid:
            return None
        doc = await users_col.find_one({"_id": oid})
        return _public_user(doc) if doc else None


class ReportModel:
    @staticmethod
    async def create_report(data: dict) -> str:
        doc = {
            **data,
            "saved": False,
            "created_at": datetime.now(timezone.utc),
        }
        result = await reports_col.insert_one(doc)
        return str(result.inserted_id)

    @staticmethod
    async def get_user_reports(user_id: str) -> list[dict]:
        cursor = reports_col.find({"user_id": user_id}).sort("created_at", -1)
        return [_serialize_report(doc) async for doc in cursor]

    @staticmethod
    async def get_report_by_id(report_id: str) -> dict | None:
        oid = _oid(report_id)
        if not oid:
            return None
        doc = await reports_col.find_one({"_id": oid})
        return _serialize_report(doc) if doc else None

    @staticmethod
    async def save_report(report_id: str, user_id: str) -> bool:
        oid = _oid(report_id)
        if not oid:
            return False
        result = await reports_col.update_one(
            {"_id": oid, "user_id": user_id}, {"$set": {"saved": True}}
        )
        return result.matched_count > 0

    @staticmethod
    async def get_saved_reports(user_id: str) -> list[dict]:
        cursor = reports_col.find({"user_id": user_id, "saved": True}).sort("created_at", -1)
        return [_serialize_report(doc) async for doc in cursor]


def _serialize_report(doc: dict) -> dict:
    return {
        "report_id": str(doc["_id"]),
        "user_id": doc.get("user_id"),
        "query": doc.get("query"),
        "report": doc.get("report"),
        "subtopics": doc.get("subtopics", []),
        "saved": doc.get("saved", False),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        "cached": doc.get("cached", False),
    }


class HistoryModel:
    @staticmethod
    async def add_history(user_id: str, query: str) -> None:
        await history_col.insert_one(
            {"user_id": user_id, "query": query, "timestamp": datetime.now(timezone.utc)}
        )

    @staticmethod
    async def get_user_history(user_id: str) -> list[dict]:
        cursor = history_col.find({"user_id": user_id}).sort("timestamp", -1).limit(100)
        return [
            {"query": doc["query"], "timestamp": doc["timestamp"].isoformat()}
            async for doc in cursor
        ]
