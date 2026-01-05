"""
Redis cache utilities
"""
import redis
import json
from typing import Optional, Any
from app.config import settings

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    decode_responses=True
)


def get_cache(key: str) -> Optional[Any]:
    """Get value from cache"""
    try:
        value = redis_client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception:
        return None


def set_cache(key: str, value: Any, ttl: int = 300) -> bool:
    """Set value in cache with TTL (seconds)"""
    try:
        redis_client.setex(key, ttl, json.dumps(value))
        return True
    except Exception:
        return False


def delete_cache(key: str) -> bool:
    """Delete value from cache"""
    try:
        redis_client.delete(key)
        return True
    except Exception:
        return False


def delete_cache_pattern(pattern: str) -> bool:
    """Delete all keys matching pattern"""
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
        return True
    except Exception:
        return False

