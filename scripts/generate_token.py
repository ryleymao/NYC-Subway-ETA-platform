#!/usr/bin/env python3
"""
Generate JWT tokens for API authentication
Usage: python generate_token.py [--expires-in 3600]

Requires JWT_SECRET environment variable to be set.
"""
import jwt
import argparse
import os
import sys
from datetime import datetime, timedelta

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"


def generate_token(expires_in_hours=24):
    """Generate a JWT token for API access"""
    if not JWT_SECRET:
        print("ERROR: JWT_SECRET environment variable is not set.", file=sys.stderr)
        print("Please set it before running this script:", file=sys.stderr)
        print("  export JWT_SECRET=your-secret-key", file=sys.stderr)
        print("  python generate_token.py", file=sys.stderr)
        sys.exit(1)
    
    if JWT_SECRET == "change-me-in-production":
        print("WARNING: Using default JWT_SECRET. This is not secure for production!", file=sys.stderr)
        print("Please set a strong random secret in your .env file.", file=sys.stderr)
    
    payload = {
        "sub": "api_user",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=expires_in_hours)
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate JWT token for API authentication")
    parser.add_argument(
        "--expires-in",
        type=int,
        default=24,
        help="Token expiration in hours (default: 24)"
    )
    
    args = parser.parse_args()
    
    try:
        token = generate_token(args.expires_in)
        print(f"JWT Token (expires in {args.expires_in} hours):")
        print(token)
        print("\nUsage:")
        print(f'curl -H "Authorization: Bearer {token}" http://localhost:8000/eta?line=1&station_id=101')
    except SystemExit:
        raise
    except Exception as e:
        print(f"ERROR: Failed to generate token: {e}", file=sys.stderr)
        sys.exit(1)

