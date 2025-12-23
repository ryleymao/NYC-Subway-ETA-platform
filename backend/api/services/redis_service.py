"""
Redis service for caching ETA data
"""
import json
import logging
import redis
from typing import Optional, Dict, List
from datetime import datetime

from ..config import Config

logger = logging.getLogger(__name__)


class RedisService:
    """Service for interacting with Redis cache"""
    
    def __init__(self, config: Config = None):
        self.config = config or Config()
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
    
    def get_eta(self, line: str, station_id: str, direction: Optional[str] = None) -> Optional[Dict]:
        """
        Get cached ETA data for a line and station
        
        Args:
            line: Subway line (e.g., "1", "A")
            station_id: GTFS station ID
            direction: Optional direction filter ("N" or "S")
        
        Returns:
            Cached ETA data or None if not found
        """
        directions = [direction.upper()] if direction else ["N", "S"]
        results = []
        
        for dir_key in directions:
            cache_key = f"eta:{line}:{station_id}:{dir_key}"
            try:
                cached_data = self.client.get(cache_key)
                if cached_data:
                    eta_data = json.loads(cached_data)
                    results.append({
                        "direction": dir_key,
                        "trains": eta_data.get("trains", [])
                    })
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode cached data for {cache_key}: {e}")
            except Exception as e:
                logger.error(f"Error fetching ETA from cache: {e}")
        
        return results if results else None
    
    def set_eta(
        self, 
        line: str, 
        station_id: str, 
        direction: str, 
        trains: List[Dict],
        station_name: Optional[str] = None,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Cache ETA data in Redis
        
        Args:
            line: Subway line
            station_id: GTFS station ID
            direction: Direction ("N" or "S")
            trains: List of train ETA dictionaries
            station_name: Optional station name
            ttl: Optional TTL in seconds (defaults to config value)
        
        Returns:
            True if successful, False otherwise
        """
        cache_key = f"eta:{line}:{station_id}:{direction}"
        cache_value = {
            "line": line,
            "station_id": station_id,
            "direction": direction,
            "trains": trains,
            "station_name": station_name,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        try:
            ttl = ttl or self.config.REDIS_TTL_SECONDS
            self.client.setex(cache_key, ttl, json.dumps(cache_value))
            logger.debug(f"Cached ETA: {cache_key} ({len(trains)} trains)")
            return True
        except Exception as e:
            logger.error(f"Failed to cache ETA for {cache_key}: {e}")
            return False
    
    def get_stations(self, line: str) -> Optional[List[Dict]]:
        """Get list of stations for a line from cache"""
        cache_key = f"stations:{line}"
        try:
            cached_data = self.client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Error fetching stations from cache: {e}")
        return None
    
    def close(self):
        """Close Redis connection"""
        if self._client:
            self._client.close()
            self._client = None

