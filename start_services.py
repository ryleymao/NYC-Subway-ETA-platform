#!/usr/bin/env python3
"""Start all services using docker-compose"""
import subprocess
import sys
import os
from pathlib import Path

def main():
    project_root = Path(__file__).parent
    infra_dir = project_root / "infra"
    
    # Create .env file if it doesn't exist
    env_file = infra_dir / ".env"
    if not env_file.exists():
        print("Creating .env file...")
        with open(env_file, "w") as f:
            f.write("JWT_SECRET=dev-secret-change-in-production\n")
            f.write("POLL_INTERVAL=30\n")
    
    # Run docker-compose
    print("Starting services with docker-compose...")
    os.chdir(infra_dir)
    
    result = subprocess.run(
        ["docker-compose", "up", "-d", "--build"],
        capture_output=False,
        text=True
    )
    
    if result.returncode == 0:
        print("\n✅ Services started successfully!")
        print("\nAccess the application:")
        print("  Frontend: http://localhost:3000")
        print("  API Docs: http://localhost:8000/docs")
        print("  API: http://localhost:8000")
        print("\nWait 30-60 seconds for services to initialize...")
    else:
        print("\n❌ Failed to start services")
        sys.exit(1)

if __name__ == "__main__":
    main()

