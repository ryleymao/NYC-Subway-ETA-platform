"""
Worker service for fetching and processing MTA real-time GTFS data
Polls MTA API, processes ETAs, and updates Redis cache via Kafka
"""
import time
import logging
import signal
import sys
from typing import List

from config import WorkerConfig
from services import MTAFetcher, GTFSParser, CacheService, KafkaService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class WorkerService:
    """Main worker service orchestrating feed fetching and processing"""
    
    def __init__(self):
        self.config = WorkerConfig()
        self.mta_fetcher = MTAFetcher(self.config)
        self.gtfs_parser = GTFSParser(self.config)
        self.cache_service = CacheService(self.config)
        self.kafka_service = KafkaService(self.config)
        self.running = True
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.running = False
    
    def process_feeds(self):
        """Main processing loop: fetch feeds, process ETAs, update cache"""
        logger.info("Starting MTA feed processing worker")
        logger.info(f"Target lines: {', '.join(self.config.TARGET_LINES)}")
        logger.info(f"Poll interval: {self.config.POLL_INTERVAL} seconds")
        
        # Test connections
        if not self.cache_service.ping():
            logger.error("Failed to connect to Redis. Check Redis service.")
            return
        
        logger.info("Worker initialized successfully")
        
        while self.running:
            try:
                lines_processed_all_feeds = []
                
                # Process each feed
                for feed_name, feed_url in self.config.MTA_FEEDS.items():
                    logger.debug(f"Processing feed: {feed_name}")
                    
                    # Fetch feed
                    feed_data_bytes = self.mta_fetcher.fetch_feed(feed_url)
                    if not feed_data_bytes:
                        continue
                    
                    # Parse feed
                    try:
                        feed = self.gtfs_parser.parse_feed(feed_data_bytes)
                        logger.debug(f"Parsed feed {feed_name}: {len(feed.entity)} entities")
                    except Exception as e:
                        logger.error(f"Failed to parse GTFS feed {feed_name}: {e}", exc_info=True)
                        continue
                    
                    # Process each target line from this feed
                    # Map feed names to their respective lines
                    feed_line_mapping = {
                        "1234567S": ["1", "2", "3", "4", "5", "6", "7", "S"],
                        "ACE": ["A", "C", "E", "H"],
                        "BDFM": ["B", "D", "F", "M"],
                        "G": ["G"],
                        "JZ": ["J", "Z"],
                        "NQRW": ["N", "Q", "R", "W"],
                        "L": ["L"],
                    }
                    
                    feed_lines = []
                    if feed_name in feed_line_mapping:
                        feed_lines = [
                            line for line in self.config.TARGET_LINES 
                            if line in feed_line_mapping[feed_name]
                        ]
                    
                    for line in feed_lines:
                        try:
                            # Extract ETAs for this line
                            etas_by_station = self.gtfs_parser.extract_etas(feed, line)
                            
                            if etas_by_station:
                                # Update cache
                                cached_count = self.cache_service.update_etas(line, etas_by_station)
                                logger.info(f"Line {line}: Cached ETAs for {cached_count} stations ({sum(len(v) for v in etas_by_station.values())} total trains)")
                        
                        except Exception as e:
                            logger.error(f"Error processing line {line}: {e}", exc_info=True)
                    
                    lines_processed_all_feeds.extend(feed_lines)
                    
                    # Publish to Kafka
                    if feed_lines:
                        self.kafka_service.publish_eta_processed(feed_name, feed_lines)
                
                if lines_processed_all_feeds:
                    logger.info(f"Completed processing cycle. Lines processed: {set(lines_processed_all_feeds)}")
                
                # Sleep before next poll
                logger.debug(f"Sleeping for {self.config.POLL_INTERVAL} seconds...")
                time.sleep(self.config.POLL_INTERVAL)
            
            except KeyboardInterrupt:
                logger.info("Received keyboard interrupt, shutting down...")
                break
            except Exception as e:
                logger.error(f"Unexpected error in processing loop: {e}", exc_info=True)
                time.sleep(self.config.POLL_INTERVAL)
        
        self.shutdown()
    
    def shutdown(self):
        """Cleanup resources"""
        logger.info("Shutting down worker service...")
        self.cache_service.close()
        self.kafka_service.close()
        logger.info("Worker service shut down complete")


def main():
    """Entry point"""
    worker = WorkerService()
    try:
        worker.process_feeds()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

