# NYC Subway ETA Platform

A real-time NYC Subway ETA platform with an interactive map, GPS-based station finder, and live train arrival predictions.

## Features

- 🗺️ **Interactive Subway Map**: Visualize all 22 NYC subway lines with accurate station locations using GTFS data
- 📍 **GPS-Based Station Finder**: Find the nearest subway stations to your current location
- ⏱️ **Real-Time ETAs**: Get live train arrival times for any station and direction
- 📊 **Line Status Overview**: View operational status of all subway lines
- 📱 **Mobile-Friendly**: Responsive design optimized for mobile users
- 🎨 **Modern UI**: Clean, professional interface built with React and Tailwind CSS

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + TypeScript + Vite
- **Map**: Leaflet.js with React-Leaflet
- **Styling**: Tailwind CSS
- **Data Storage**: Redis (caching)
- **Real-Time Data**: MTA GTFS Real-time feeds
- **Static Data**: MTA GTFS Static feeds (for accurate station coordinates)

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
cd infra
docker-compose up -d --build
```

Wait ~30 seconds for services to start, then:
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

### Option 2: Local Development

#### Prerequisites
- Python 3.10+ (with venv support)
- Node.js 18+ and npm
- Redis (for API caching)

#### Backend Setup

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
cd backend/api
pip install -r requirements.txt

# Set environment variables
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_DB=0
export JWT_SECRET=dev-secret-change-in-production

# Run API server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:3000 (or another port if 3000 is in use).

#### Redis Setup

If Redis is not installed:

```bash
# macOS
brew install redis
brew services start redis

# Or use Docker
docker run -d -p 6379:6379 redis:latest
```

## Generate GTFS Station Data

The map uses accurate station coordinates from MTA GTFS static data. To generate/update the station coordinates:

```bash
# Ensure gtfs_subway.zip is in the scripts/ directory
# Then run:
python3 scripts/fetch_gtfs_stations.py
```

This will generate `frontend/src/data/station_coords.json` with accurate coordinates and proper station ordering for all subway lines.

## Authentication

The API requires JWT authentication. Generate a token:

```bash
export JWT_SECRET=dev-secret-change-in-production
python3 scripts/generate_token.py
```

Copy the generated token and enter it in the frontend when prompted.

## Project Structure

```
.
├── backend/
│   ├── api/              # FastAPI backend
│   │   ├── routers/      # API endpoints
│   │   └── services/     # Business logic
│   └── worker/           # Background worker for fetching MTA data
├── frontend/
│   └── src/
│       ├── components/   # React components
│       │   ├── SubwayMap.tsx
│       │   ├── FindNearestStation.tsx
│       │   ├── StationSelector.tsx
│       │   ├── ETADisplay.tsx
│       │   └── LineStatus.tsx
│       ├── hooks/        # Custom React hooks
│       └── data/         # Static data (station coordinates)
├── scripts/
│   ├── fetch_gtfs_stations.py  # GTFS data parser
│   └── generate_token.py       # JWT token generator
└── infra/
    └── docker-compose.yml       # Docker services configuration
```

## Key Components

- **SubwayMap**: Interactive Leaflet map showing all subway lines and stations
- **FindNearestStation**: GPS-based component to find nearby stations
- **StationSelector**: Line and station selection interface
- **ETADisplay**: Real-time train arrival predictions
- **LineStatus**: Overview of all subway line operational status
- **Navigation**: Tabbed navigation between ETA Lookup and Line Status

## API Endpoints

- `GET /health` - Health check
- `GET /eta?line={line}&station_id={id}&direction={N|S}` - Get train ETAs
- `GET /stations/{line}` - Get stations for a line
- `GET /status` - Get status of all lines

See http://localhost:8000/docs for full API documentation.

## Development

See [docs/DEV.md](./docs/DEV.md) for detailed development documentation.

## Notes

- The map uses accurate GTFS static data for station coordinates and route ordering
- All 22 regular NYC subway lines are supported (shuttle lines excluded)
- The frontend auto-reloads on file changes (Vite HMR)
- The API auto-reloads on code changes (uvicorn --reload)

## License

MIT
