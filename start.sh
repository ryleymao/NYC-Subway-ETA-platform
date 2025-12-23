#!/bin/bash
set -e

# Create .env if it doesn't exist
cd "$(dirname "$0")/infra"
if [ ! -f .env ]; then
    echo "JWT_SECRET=dev-secret-change-in-production" > .env
    echo "POLL_INTERVAL=30" >> .env
    echo "Created .env file"
fi

# Start services
echo "Starting services..."
docker-compose up -d --build

echo ""
echo "✅ Services started!"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Wait 30-60 seconds for initialization..."
