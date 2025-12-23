"""
ETA router - handles ETA-related endpoints
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..models import ETAResponse, ErrorResponse
from ..config import Config
from ..services.redis_service import RedisService
from ..services.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/eta", tags=["ETA"])
security = HTTPBearer()
config = Config()
redis_service = RedisService(config)
auth_service = AuthService(config)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to verify JWT token"""
    return auth_service.verify_token(credentials.credentials)


@router.get("", response_model=ETAResponse)
async def get_eta(
    line: str,
    station_id: str,
    direction: Optional[str] = None,
    token_payload: dict = Depends(verify_token)
):
    """
    Get next 3 train ETAs for a given line and station
    
    **Parameters:**
    - `line`: Subway line (e.g., "1", "2", "A", "C", "E")
    - `station_id`: GTFS station ID (e.g., "101")
    - `direction`: Optional direction filter ("N" or "S")
    
    **Returns:**
    - ETAResponse with next 3 trains per direction
    
    **Example:**
    ```
    GET /eta?line=1&station_id=101&direction=N
    ```
    """
    # Normalize line to uppercase
    line = line.upper()
    
    # Validate line
    if line not in config.SUPPORTED_LINES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid line. Supported lines: {', '.join(config.SUPPORTED_LINES)}"
        )
    
    # Validate direction if provided
    if direction:
        direction = direction.upper()
        if direction not in ["N", "S"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Direction must be 'N' (Northbound) or 'S' (Southbound)"
            )
    
    try:
        # Fetch from Redis cache
        eta_data = redis_service.get_eta(line, station_id, direction)
        
        if not eta_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No ETA data found for line {line} at station {station_id}"
            )
        
        # Transform to response model
        from ..models import DirectionETA, TrainETA
        direction_etas = []
        station_name = None
        
        for dir_data in eta_data:
            trains = [TrainETA(**train) for train in dir_data.get("trains", [])]
            direction_etas.append(DirectionETA(
                direction=dir_data["direction"],
                trains=trains[:3]  # Top 3 trains
            ))
            # Extract station name from first available entry
            if not station_name:
                # Try to get from cache
                cached_raw = redis_service.client.get(f"eta:{line}:{station_id}:{dir_data['direction']}")
                if cached_raw:
                    import json
                    cached = json.loads(cached_raw)
                    station_name = cached.get("station_name")
        
        return ETAResponse(
            line=line,
            station_id=station_id,
            station_name=station_name,
            etas=direction_etas
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching ETA: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/stations/{line}", response_model=dict)
async def get_stations(
    line: str,
    token_payload: dict = Depends(verify_token)
):
    """
    Get list of stations for a given line (from cache)
    
    **Parameters:**
    - `line`: Subway line identifier
    
    **Returns:**
    - Dictionary with line and list of stations
    """
    line = line.upper()
    
    if line not in config.SUPPORTED_LINES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid line. Supported lines: {', '.join(config.SUPPORTED_LINES)}"
        )
    
    stations = redis_service.get_stations(line)
    
    if stations:
        return stations
    else:
        return {"line": line, "stations": []}

