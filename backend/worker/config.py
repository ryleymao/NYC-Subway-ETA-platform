"""
Configuration management for Worker service
"""
import os

class WorkerConfig:
    """Worker service configuration"""
    
    # MTA API Configuration
    # MTA feeds are publicly accessible - no API key required
    
    # MTA Feed URLs for different lines
    # Official MTA API: https://api.mta.info/#/subwayRealTimeFeeds
    MTA_FEEDS = {
        "1234567S": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",  # 1,2,3,4,5,6,7,S lines
        "ACE": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",  # A,C,E,H lines
        "BDFM": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",  # B,D,F,M,FS lines
        "G": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g",  # G line
        "JZ": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",  # J,Z lines
        "NQRW": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",  # N,Q,R,W lines
        "L": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",  # L line
    }
    
    # Target lines - all 22 regular NYC subway lines (excluding shuttles)
    TARGET_LINES = ["1", "2", "3", "4", "5", "6", "7", "A", "B", "C", "D", "E", "F", "G", "J", "L", "M", "N", "Q", "R", "W", "Z"]
    
    # Redis Configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "redis")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_TIMEOUT: int = int(os.getenv("REDIS_TIMEOUT", "5"))
    REDIS_TTL_SECONDS: int = int(os.getenv("REDIS_TTL_SECONDS", "300"))  # 5 minutes
    
    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
    KAFKA_TOPIC_ETA_PROCESSED: str = os.getenv("KAFKA_TOPIC_ETA_PROCESSED", "eta_processed")
    
    # Worker Configuration
    POLL_INTERVAL: int = int(os.getenv("POLL_INTERVAL", "30"))  # seconds
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))
    RETRY_DELAY: int = int(os.getenv("RETRY_DELAY", "5"))  # seconds
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "10"))  # seconds

