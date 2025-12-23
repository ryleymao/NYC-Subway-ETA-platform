"""
Service for updating Redis cache with processed ETA data
"""
import json
import logging
import redis
from datetime import datetime
from typing import Dict, List, Optional

from ..config import WorkerConfig

logger = logging.getLogger(__name__)


class CacheService:
    """Service for caching ETA data in Redis"""
    
    def __init__(self, config: WorkerConfig = None):
        self.config = config or WorkerConfig()
        self._client: Optional[redis.Redis] = None
    
    @property
    def client(self) -> redis.Redis:
        """Lazy initialization of Redis client"""
        if self._client is None:
            self._client = redis.Redis(
                host=self.config.REDIS_HOST,
                port=self.config.REDIS_PORT,
                db=self.config.REDIS_DB,
                decode_responses=True,
                socket_connect_timeout=self.config.REDIS_TIMEOUT
            )
        return self._client
    
    def ping(self) -> bool:
        """Check Redis connection"""
        try:
            return self.client.ping()
        except Exception as e:
            logger.error(f"Redis ping failed: {e}")
            return False
    
    def update_etas(
        self,
        line: str,
        etas_by_station: Dict[str, List[Dict]],
        station_names: Optional[Dict[str, str]] = None
    ) -> int:
        """
        Update Redis cache with processed ETAs
        
        Args:
            line: Subway line identifier
            etas_by_station: Dictionary mapping "{station_id}:{direction}" to list of train ETAs
            station_names: Optional dictionary mapping station_id to station name
        
        Returns:
            Number of stations successfully cached
        """
        cached_count = 0
        station_names = station_names or {}
        
        for key, eta_list in etas_by_station.items():
            station_id, direction = key.split(":")
            
            # Sort by ETA and take top 3
            sorted_etas = sorted(eta_list, key=lambda x: x["eta_minutes"])[:3]
            
            cache_key = f"eta:{line}:{station_id}:{direction}"
            cache_value = {
                "line": line,
                "station_id": station_id,
                "direction": direction,
                "trains": sorted_etas,
                "station_name": station_names.get(station_id),
                "last_updated": datetime.utcnow().isoformat()
            }
            
            try:
                self.client.setex(
                    cache_key,
                    self.config.REDIS_TTL_SECONDS,
                    json.dumps(cache_value)
                )
                cached_count += 1
                logger.debug(f"Cached ETA: {cache_key} ({len(sorted_etas)} trains)")
            except Exception as e:
                logger.error(f"Failed to cache ETA for {cache_key}: {e}")
        
        return cached_count
    
    def close(self):
        """Close Redis connection"""
        if self._client:
            self._client.close()
            self._client = None

