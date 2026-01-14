"""
Forecast model
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base


class Forecast(Base):
    """Forecast model"""
    __tablename__ = "forecasts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    market_id = Column(String, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False, index=True)
    outcome_id = Column(String, ForeignKey("outcomes.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Forecast details
    points = Column(Integer, nullable=False)  # Number of chips allocated to this forecast
    reward_amount = Column(Integer, nullable=True)  # Actual reward amount when forecast wins (null if pending or lost)
    
    # Status: pending (market not resolved), won (correct), lost (incorrect)
    status = Column(String, default="pending", nullable=False, index=True)
    
    # Flagging
    is_flagged = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", backref="forecasts")
    market = relationship("Market", backref="forecasts")
    outcome = relationship("Outcome", backref="forecasts")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'market_id', name='uq_forecast_user_market'),  # One forecast per user per market
        CheckConstraint('points > 0', name='check_points_positive'),
        CheckConstraint("status IN ('pending', 'won', 'lost')", name='check_status'),
    )

