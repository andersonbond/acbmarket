"""
Forecast schemas
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class ForecastBase(BaseModel):
    """Base forecast schema"""
    outcome_id: str = Field(..., description="ID of the outcome to forecast")
    points: int = Field(..., ge=20, description="Number of chips to allocate (minimum 20)")


class ForecastCreate(ForecastBase):
    """Forecast creation schema"""
    pass


class ForecastUpdate(BaseModel):
    """Forecast update schema"""
    outcome_id: Optional[str] = None
    points: Optional[int] = Field(None, ge=20)


class ForecastResponse(BaseModel):
    """Forecast response schema"""
    id: str
    user_id: str
    market_id: str
    outcome_id: str
    points: int
    reward_amount: Optional[int] = None  # Actual reward amount when forecast wins (null if pending or lost)
    status: str  # pending, won, lost
    is_flagged: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ForecastDetailResponse(ForecastResponse):
    """Forecast detail response with related data"""
    outcome_name: Optional[str] = None
    market_title: Optional[str] = None


class ForecastListResponse(BaseModel):
    """Forecast list response schema"""
    forecasts: list[ForecastDetailResponse]
    total_count: int
    page: int
    limit: int
    total_pages: int

