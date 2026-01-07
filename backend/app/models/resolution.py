"""
Resolution model
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base


class Resolution(Base):
    """Resolution model - Immutable record of market resolution"""
    __tablename__ = "resolutions"

    id = Column(String, primary_key=True, index=True)
    market_id = Column(String, ForeignKey("markets.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    outcome_id = Column(String, ForeignKey("outcomes.id", ondelete="CASCADE"), nullable=False, index=True)
    resolved_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)  # Admin who resolved
    
    # Resolution details
    evidence_urls = Column(JSON, nullable=False)  # Array of evidence URLs stored as JSON (min 1, min 2 for elections)
    resolution_note = Column(Text, nullable=False)  # Explanation of resolution
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    # Note: No updated_at - resolutions are immutable
    
    # Relationships
    market = relationship("Market", backref="resolution")
    outcome = relationship("Outcome", backref="resolutions")
    resolver = relationship("User", foreign_keys=[resolved_by])

