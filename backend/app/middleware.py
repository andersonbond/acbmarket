"""
Custom middleware
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import time

from app.utils.cache import redis_client


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""
    
    async def dispatch(self, request: Request, call_next):
        # Simple rate limiting (can be enhanced)
        client_ip = request.client.host
        rate_limit_key = f"ratelimit:ip:{client_ip}"
        
        # Check rate limit (10 requests per minute per IP)
        current = redis_client.get(rate_limit_key)
        if current and int(current) >= 10:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "data": None,
                    "errors": [{"message": "Rate limit exceeded"}],
                },
            )
        
        # Increment counter
        redis_client.incr(rate_limit_key)
        redis_client.expire(rate_limit_key, 60)
        
        response = await call_next(request)
        return response

