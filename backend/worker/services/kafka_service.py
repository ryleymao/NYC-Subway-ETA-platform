"""
Service for Kafka messaging
"""
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from kafka import KafkaProducer
from kafka.errors import KafkaError

from ..config import WorkerConfig

logger = logging.getLogger(__name__)


class KafkaService:
    """Service for publishing messages to Kafka"""
    
    def __init__(self, config: WorkerConfig = None):
        self.config = config or WorkerConfig()
        self._producer: Optional[KafkaProducer] = None
    
    @property
    def producer(self) -> Optional[KafkaProducer]:
        """Lazy initialization of Kafka producer"""
        if self._producer is None:
            try:
                self._producer = KafkaProducer(
                    bootstrap_servers=self.config.KAFKA_BOOTSTRAP_SERVERS,
                    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                    key_serializer=lambda k: k.encode('utf-8') if k else None,
                    retries=3,
                    max_in_flight_requests_per_connection=1,
                    enable_idempotence=True
                )
                logger.info(f"Connected to Kafka at {self.config.KAFKA_BOOTSTRAP_SERVERS}")
            except Exception as e:
                logger.error(f"Failed to connect to Kafka: {e}")
                logger.warning("Continuing without Kafka - caching will still work")
        return self._producer
    
    def publish_eta_processed(self, feed_name: str, lines_processed: List[str]) -> bool:
        """
        Publish ETA processed event to Kafka
        
        Args:
            feed_name: Name of the feed that was processed
            lines_processed: List of line identifiers that were processed
        
        Returns:
            True if published successfully, False otherwise
        """
        if not self.producer:
            return False
        
        try:
            message = {
                "feed": feed_name,
                "lines": lines_processed,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.producer.send(
                self.config.KAFKA_TOPIC_ETA_PROCESSED,
                key=f"feed_{feed_name}",
                value=message
            )
            self.producer.flush()
            logger.debug(f"Published to Kafka: {feed_name}")
            return True
        except KafkaError as e:
            logger.error(f"Failed to publish to Kafka: {e}")
            return False
    
    def close(self):
        """Close Kafka producer"""
        if self._producer:
            self._producer.close()
            self._producer = None

