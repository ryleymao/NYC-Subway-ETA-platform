"""
JWT authentication service
"""
import jwt
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, status

from ..config import Config

logger = logging.getLogger(__name__)


class AuthService:
    """Service for JWT token validation"""
    
    def __init__(self, config: Config = None):
        self.config = config or Config()
    
    def verify_token(self, token: str) -> Dict:
        """
        Verify and decode JWT token
        
        Args:
            token: JWT token string
        
        Returns:
            Decoded token payload
        
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token, 
                self.config.JWT_SECRET, 
                algorithms=[self.config.JWT_ALGORITHM]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    
    def generate_token(self, user_id: str = "api_user", expires_in_hours: Optional[int] = None) -> str:
        """
        Generate a new JWT token
        
        Args:
            user_id: User identifier
            expires_in_hours: Token expiration in hours (defaults to config value)
        
        Returns:
            Encoded JWT token
        """
        expires_in = expires_in_hours or self.config.JWT_EXPIRATION_HOURS
        payload = {
            "sub": user_id,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=expires_in)
        }
        
        return jwt.encode(payload, self.config.JWT_SECRET, algorithm=self.config.JWT_ALGORITHM)

