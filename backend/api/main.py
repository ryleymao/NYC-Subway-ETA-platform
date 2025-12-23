"""
FastAPI application for NYC Subway ETA API
Provides REST endpoints to query cached ETA data
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import Config
from routers import eta_router
from routers import health
import logging

config = Config()
config.validate()  # Validate configuration on startup

logger = logging.getLogger(__name__)

app = FastAPI(
    title="NYC Subway ETA API",
    description="Real-time subway arrival estimates for Manhattan-bound lines",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware (configure as needed for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(eta_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "NYC Subway ETA API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=True
    )

