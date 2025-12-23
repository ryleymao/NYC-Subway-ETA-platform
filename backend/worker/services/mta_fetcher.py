"""
Service for fetching MTA GTFS real-time feeds
"""
import time
import logging
import requests
from typing import Optional

from ..config import WorkerConfig

logger = logging.getLogger(__name__)


class MTAFetcher:
    """Service for fetching MTA API feeds with retry logic"""
    
    def __init__(self, config: WorkerConfig = None):
        self.config = config or WorkerConfig()
    
    def fetch_feed(self, feed_url: str, retries: Optional[int] = None) -> Optional[bytes]:
        """
        Fetch GTFS real-time feed from MTA API with retry logic
        
        Args:
            feed_url: MTA API feed URL
            retries: Number of retry attempts (defaults to config value)
        
        Returns:
            Feed data as bytes, or None if all retries failed
        """
        retries = retries or self.config.MAX_RETRIES
        headers = {}  # MTA feeds are publicly accessible, no authentication needed
        
        for attempt in range(retries):
            try:
                response = requests.get(
                    feed_url,
                    headers=headers,
                    timeout=self.config.REQUEST_TIMEOUT
                )
                response.raise_for_status()
                logger.info(f"Successfully fetched feed: {feed_url}")
                return response.content
            except requests.exceptions.Timeout:
                logger.warning(f"Attempt {attempt + 1}/{retries} timed out for {feed_url}")
            except requests.exceptions.HTTPError as e:
                status_code = e.response.status_code if hasattr(e, 'response') else None
                logger.warning(f"Attempt {attempt + 1}/{retries} HTTP error for {feed_url}: Status {status_code}")
            except requests.exceptions.RequestException as e:
                logger.warning(f"Attempt {attempt + 1}/{retries} failed for {feed_url}: {e}")
            
            if attempt < retries - 1:
                time.sleep(self.config.RETRY_DELAY)
        
        logger.error(f"Failed to fetch feed after {retries} attempts: {feed_url}")
        return None

