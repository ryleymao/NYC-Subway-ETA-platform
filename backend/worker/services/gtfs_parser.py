"""
Service for parsing GTFS real-time protobuf feeds
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional

from google.transit import gtfs_realtime_pb2

from ..config import WorkerConfig

logger = logging.getLogger(__name__)


class GTFSParser:
    """Service for parsing GTFS real-time protobuf data"""
    
    def __init__(self, config: WorkerConfig = None):
        self.config = config or WorkerConfig()
    
    def parse_feed(self, feed_data: bytes):
        """
        Parse GTFS real-time protobuf feed
        
        Args:
            feed_data: Raw protobuf bytes from MTA API
        
        Returns:
            FeedMessage protobuf object
        """
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(feed_data)
        return feed
    
    def extract_etas(self, feed, line: Optional[str] = None) -> Dict[str, List[Dict]]:
        """
        Extract ETA information from parsed feed for specific line(s)
        
        Args:
            feed: Parsed FeedMessage object
            line: Optional line filter (e.g., "1", "A")
        
        Returns:
            Dictionary mapping "{station_id}:{direction}" to list of train ETAs
        """
        etas_by_station: Dict[str, List[Dict]] = {}
        now = datetime.utcnow()
        
        for entity in feed.entity:
            if not entity.HasField('trip_update'):
                continue
            
            trip_update = entity.trip_update
            trip = trip_update.trip
            
            # Extract route ID
            route_id = trip.route_id
            if not route_id or route_id not in self.config.TARGET_LINES:
                continue
            
            # Filter by line if specified
            if line and route_id != line:
                continue
            
            # Determine direction
            direction = "N"  # Default
            if trip.HasField('direction_id'):
                direction = "S" if trip.direction_id == 1 else "N"
            
            # Process stop time updates
            for stop_time_update in trip_update.stop_time_update:
                station_id = stop_time_update.stop_id
                
                # Get arrival time
                arrival_time = None
                if stop_time_update.HasField('arrival'):
                    if stop_time_update.arrival.HasField('time'):
                        arrival_time = datetime.fromtimestamp(stop_time_update.arrival.time)
                
                # Only include future arrivals
                if arrival_time and arrival_time > now:
                    eta_minutes = int((arrival_time - now).total_seconds() / 60)
                    
                    key = f"{station_id}:{direction}"
                    if key not in etas_by_station:
                        etas_by_station[key] = []
                    
                    etas_by_station[key].append({
                        "arrival_time": arrival_time.isoformat(),
                        "eta_minutes": eta_minutes,
                        "train_id": trip.trip_id,
                        "route_id": route_id,
                        "status": "on_time"
                    })
        
        return etas_by_station

