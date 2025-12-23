"""
Pydantic models for API request/response schemas
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class TrainETA(BaseModel):
    """Individual train ETA information"""
    arrival_time: str = Field(..., description="ISO format arrival time")
    eta_minutes: int = Field(..., description="Minutes until arrival", ge=0)
    train_id: str = Field(..., description="GTFS trip ID")
    route_id: str = Field(..., description="Subway line identifier")
    status: str = Field(default="on_time", description="Train status")


class DirectionETA(BaseModel):
    """ETAs for a specific direction"""
    direction: str = Field(..., description="Direction: N (Northbound) or S (Southbound)")
    trains: List[TrainETA] = Field(..., description="List of next trains")


class ETAResponse(BaseModel):
    """Response model for ETA endpoint"""
    line: str = Field(..., description="Subway line identifier")
    station_id: str = Field(..., description="GTFS station ID")
    station_name: Optional[str] = Field(None, description="Human-readable station name")
    etas: List[DirectionETA] = Field(..., description="ETAs grouped by direction")
    last_updated: Optional[str] = Field(None, description="When data was last updated")


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(None, description="Additional error details")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    redis: str
    timestamp: str

