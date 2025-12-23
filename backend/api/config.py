"""
Configuration management for API service
"""
import os
from typing import Optional

class Config:
    """Application configuration"""
    
    # JWT Configuration
    # NOTE: In production, JWT_SECRET must be set via environment variable
    # Default is only for development. Never use default in production!
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    @classmethod
    def validate(cls):
        """Validate configuration - warn if using insecure defaults"""
        import logging
        logger = logging.getLogger(__name__)
        
        if cls.JWT_SECRET == "change-me-in-production":
            logger.warning(
                "WARNING: Using default JWT_SECRET. This is insecure for production! "
                "Please set JWT_SECRET environment variable."
            )
    
    # Redis Configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "redis")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_TIMEOUT: int = int(os.getenv("REDIS_TIMEOUT", "5"))
    REDIS_TTL_SECONDS: int = int(os.getenv("REDIS_TTL_SECONDS", "300"))  # 5 minutes
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Supported subway lines (MVP focus on main Manhattan lines)
    # Can be expanded to support all MTA lines
    SUPPORTED_LINES = ["1", "2", "3", "4", "5", "6", "A", "C", "E"]

