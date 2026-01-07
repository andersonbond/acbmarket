"""
Resolution schemas
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime


class ResolutionBase(BaseModel):
    """Base resolution schema"""
    outcome_id: str = Field(..., description="ID of the winning outcome")
    evidence_urls: List[str] = Field(..., min_items=1, description="List of evidence URLs (min 1, min 2 for elections)")
    resolution_note: str = Field(..., min_length=10, max_length=5000, description="Explanation of the resolution")


class ResolutionCreate(ResolutionBase):
    """Resolution creation schema"""
    pass


class ResolutionResponse(ResolutionBase):
    """Resolution response schema"""
    id: str
    market_id: str
    resolved_by: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ResolutionDetailResponse(ResolutionResponse):
    """Detailed resolution response with related data"""
    outcome_name: Optional[str] = None
    resolver_name: Optional[str] = None
    market_title: Optional[str] = None

