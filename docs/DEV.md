# Development Guide

## Quick Start

```bash
cd infra
docker-compose up -d --build
```

Wait 30s, then:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Backend Routes

### GET /health
Health check (no auth)
```bash
curl http://localhost:8000/health
```

### GET /eta
Get train ETAs (requires JWT)
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/eta?line=1&station_id=101&direction=N"
```

**Query params:**
- `line` - Subway line (1,2,3,4,5,6,A,C,E)
- `station_id` - GTFS station ID
- `direction` - N or S (optional)

### GET /stations/{line}
Get stations for a line (requires JWT)
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/stations/1"
```

## Local Development

### Backend (FastAPI)

```bash
cd backend/api
pip install -r requirements.txt
export REDIS_HOST=localhost JWT_SECRET=dev-secret
uvicorn main:app --reload
```

### Worker

```bash
cd backend/worker
pip install -r requirements.txt
export REDIS_HOST=localhost
python main.py
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

## Generate JWT Token

```bash
export JWT_SECRET=dev-secret
python3 scripts/generate_token.py
```

## Project Structure

```
backend/
  api/          # FastAPI app
    routers/   # /health, /eta, /stations
    services/  # Redis, Auth
  worker/      # MTA data processor
    services/  # MTA fetcher, GTFS parser, Cache

frontend/
  src/
    components/ # React components
    App.tsx     # Main app

infra/
  docker-compose.yml  # All services
```

## Code Locations

- **API Routes**: `backend/api/routers/eta.py`, `health.py`
- **Worker Logic**: `backend/worker/main.py`
- **MTA Fetcher**: `backend/worker/services/mta_fetcher.py`
- **GTFS Parser**: `backend/worker/services/gtfs_parser.py`
- **Frontend**: `frontend/src/App.tsx`

## Testing

```bash
# Health check
curl http://localhost:8000/health

# Get token
TOKEN=$(export JWT_SECRET=dev-secret && python3 scripts/generate_token.py | tail -1)

# Test ETA
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/eta?line=1&station_id=101&direction=N"
```

## Common Issues

- **No ETA data**: Wait 30-60s for worker to process feeds
- **401 Unauthorized**: Generate new token with correct JWT_SECRET
- **Port in use**: Stop other services or change ports in docker-compose.yml

