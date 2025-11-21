import time
from typing import Dict, Tuple
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import os

class RateLimiter:
    """
    Token Bucket Rate Limiter.
    """
    def __init__(self, capacity: int = 10, refill_rate: float = 0.5):
        self.capacity = float(capacity)
        self.refill_rate = float(refill_rate)
        self._buckets: Dict[str, Dict[str, float]] = {}

    def _get_bucket(self, key: str) -> Dict[str, float]:
        now = time.time()
        if key not in self._buckets:
            self._buckets[key] = {"tokens": self.capacity, "ts": now}
        else:
            bucket = self._buckets[key]
            elapsed = now - bucket["ts"]
            refill = elapsed * self.refill_rate
            bucket["tokens"] = min(self.capacity, bucket["tokens"] + refill)
            bucket["ts"] = now
        return self._buckets[key]

    def check(self, key: str, cost: float = 1.0) -> bool:
        bucket = self._get_bucket(key)
        if bucket["tokens"] >= cost:
            bucket["tokens"] -= cost
            return True
        return False

# Global limiter instance
# Defaults can be overridden by env vars
CAPACITY = int(os.getenv("RATE_LIMIT_CAPACITY", "20"))
REFILL_RATE = float(os.getenv("RATE_LIMIT_REFILL_RATE", "1.0"))

global_limiter = RateLimiter(capacity=CAPACITY, refill_rate=REFILL_RATE)

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Apply only to API routes, exclude health check
        if request.url.path.startswith("/api") and not request.url.path.startswith("/api/health"):
            client_ip = request.client.host if request.client else "unknown"

            # We can have different limits for different paths if needed
            # For now, global limit per IP
            if not global_limiter.check(client_ip):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too Many Requests. Please slow down."}
                )

        response = await call_next(request)
        return response
