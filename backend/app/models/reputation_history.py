"""
Reputation history model
"""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base


class ReputationHistory(Base):
    """Reputation history model - tracks reputation changes over time"""
    __tablename__ = "reputation_history"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reputation = Column(Float, nullable=False)  # Reputation score at this point
    accuracy_score = Column(Float, nullable=True)  # Accuracy score used in calculation
    total_forecast_points = Column(Float, nullable=True)  # Total points at this point
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", backref="reputation_history")
    
    # Index for efficient queries
    __table_args__ = (
        Index('ix_reputation_history_user_created', 'user_id', 'created_at'),
    )

