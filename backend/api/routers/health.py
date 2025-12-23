"""
Health check router
"""
from fastapi import APIRouter
from ..models import HealthResponse
from ..services.redis_service import RedisService
from ..config import Config
from datetime import datetime

router = APIRouter(tags=["Health"])
config = Config()
redis_service = RedisService(config)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    
    **Returns:**
    - Service status and Redis connection status
    """
    redis_status = "connected" if redis_service.ping() else "disconnected"
    
    return HealthResponse(
        status="healthy",
        redis=redis_status,
        timestamp=datetime.utcnow().isoformat()
    )

