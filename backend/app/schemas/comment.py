"""
Comment schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CommentBase(BaseModel):
    """Base comment schema"""
    content: str = Field(..., min_length=1, max_length=2000, description="Comment content")


class CommentCreate(CommentBase):
    """Comment creation schema"""
    parent_id: Optional[str] = Field(None, description="Parent comment ID for replies")


class CommentUpdate(BaseModel):
    """Comment update schema"""
    content: str = Field(..., min_length=1, max_length=2000, description="Updated comment content")


class CommentUser(BaseModel):
    """User info in comment response"""
    id: str
    display_name: str
    reputation: float
    badges: Optional[List[str]] = None
    
    class Config:
        from_attributes = True


class CommentResponse(CommentBase):
    """Comment response schema"""
    id: str
    market_id: str
    user: CommentUser
    parent_id: Optional[str] = None
    like_count: int
    is_edited: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    reply_count: int = 0  # Number of direct replies
    replies: Optional[List['CommentResponse']] = None  # Nested replies
    user_liked: bool = False  # Whether current user liked this comment
    
    class Config:
        from_attributes = True


# Update forward reference
CommentResponse.model_rebuild()


class CommentListResponse(BaseModel):
    """Schema for comment list response"""
    success: bool = True
    data: dict = Field(default_factory=dict)
    errors: Optional[List[dict]] = None
