import os
from dotenv import load_dotenv

load_dotenv()


def _split_origins(raw: str) -> list[str]:
    return [o.strip() for o in raw.split(",") if o.strip()]


class Settings:
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "agentia")

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "insecure-dev-secret-change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    CORS_ORIGINS: list[str] = _split_origins(os.getenv("CORS_ORIGINS", "http://localhost:5173"))

    RESEARCH_CACHE_TTL: int = int(os.getenv("RESEARCH_CACHE_TTL", "86400"))


settings = Settings()
