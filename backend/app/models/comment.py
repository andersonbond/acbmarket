"""
Comment model
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Index, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base


class Comment(Base):
    """Comment model - nested comments for markets"""
    __tablename__ = "comments"

    id = Column(String, primary_key=True, index=True)
    market_id = Column(String, ForeignKey("markets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(String, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True)
    
    content = Column(Text, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    
    is_edited = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    market = relationship("Market", backref="comments")
    user = relationship("User", backref="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    
    # Optimized indexes for common queries
    __table_args__ = (
        Index('idx_comments_market_created', 'market_id', 'created_at', postgresql_ops={'created_at': 'DESC'}),
        Index('idx_comments_parent_created', 'parent_id', 'created_at', postgresql_ops={'created_at': 'DESC'}),
        Index('idx_comments_user_created', 'user_id', 'created_at', postgresql_ops={'created_at': 'DESC'}),
    )
