# NYC Subway ETA Platform

FastAPI backend + React frontend for real-time subway ETAs.

## Start

```bash
cd infra
docker-compose up -d --build
```

Wait 30s, then:
- Frontend: http://localhost:3000
- API: http://localhost:8000/docs

**Token**: `export JWT_SECRET=dev-secret && python3 scripts/generate_token.py`

See [docs/DEV.md](./docs/DEV.md) for routes and development.
