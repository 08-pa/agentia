import json
import logging
from datetime import datetime, timezone

import redis.asyncio as redis

from core.config import settings

logger = logging.getLogger(__name__)
_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1)
    return _client


# ---- Research result cache -------------------------------------------------
# If Redis isn't reachable, we just skip caching instead of failing the
# request — research will always run fresh (slower, but still works).

async def cache_get(key: str):
    try:
        raw = await get_redis().get(key)
        return json.loads(raw) if raw else None
    except Exception:
        logger.warning("Redis unavailable — skipping cache read")
        return None


async def cache_set(key: str, value: dict, ttl: int) -> None:
    try:
        await get_redis().set(key, json.dumps(value), ex=ttl)
    except Exception:
        logger.warning("Redis unavailable — skipping cache write")


# ---- Auth token blacklist (logout) -----------------------------------------
# If Redis isn't reachable, logout can't invalidate the token server-side —
# it just clears locally, and the token stays technically valid until it
# naturally expires (ACCESS_TOKEN_EXPIRE_MINUTES).

def _blacklist_key(jti: str) -> str:
    return f"blacklist:{jti}"


async def blacklist_token(jti: str, expires_at: datetime) -> None:
    ttl = int((expires_at - datetime.now(timezone.utc)).total_seconds())
    if ttl <= 0:
        return
    try:
        await get_redis().set(_blacklist_key(jti), "1", ex=ttl)
    except Exception:
        logger.warning("Redis unavailable — logout blacklist skipped")


async def is_token_blacklisted(jti: str) -> bool:
    try:
        return bool(await get_redis().exists(_blacklist_key(jti)))
    except Exception:
        return False


async def ping() -> bool:
    try:
        return await get_redis().ping()
    except Exception:
        return False