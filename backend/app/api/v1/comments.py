"""
Comment endpoints
"""
import uuid as uuid_module
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, func

from app.database import get_db
from app.models.comment import Comment
from app.models.market import Market
from app.models.user import User
from app.models.forecast import Forecast
from app.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    CommentListResponse,
    CommentUser,
)
from app.dependencies import get_current_user, get_current_user_optional

router = APIRouter()

# Comment limits
MAX_COMMENT_LENGTH = 2000
MAX_NESTING_DEPTH = 4
MAX_COMMENTS_PER_MINUTE = 10


def build_comment_tree(
    comments: List[Comment],
    current_user_id: Optional[str] = None,
    max_depth: int = MAX_NESTING_DEPTH,
    current_depth: int = 0
) -> List[CommentResponse]:
    """Build nested comment tree structure"""
    if current_depth >= max_depth:
        return []
    
    result = []
    for comment in comments:
        if comment.is_deleted:
            # Show deleted comment placeholder
            comment_data = CommentResponse(
                id=comment.id,
                market_id=comment.market_id,
                user=CommentUser(
                    id=comment.user.id,
                    display_name=comment.user.display_name,
                    reputation=comment.user.reputation,
                    badges=comment.user.badges or [],
                ),
                parent_id=comment.parent_id,
                content="[deleted]",
                like_count=comment.like_count,
                is_edited=False,
                is_deleted=True,
                created_at=comment.created_at,
                updated_at=comment.updated_at,
                reply_count=0,
                replies=[],
                user_liked=False,
            )
        else:
            # Get reply count (direct children only)
            reply_count = len([r for r in comment.replies if not r.is_deleted])
            
            # Get nested replies
            nested_replies = []
            if comment.replies:
                sorted_replies = sorted(
                    [r for r in comment.replies if not r.is_deleted],
                    key=lambda x: x.created_at
                )
                nested_replies = build_comment_tree(
                    sorted_replies,
                    current_user_id,
                    max_depth,
                    current_depth + 1
                )
            
            comment_data = CommentResponse(
                id=comment.id,
                market_id=comment.market_id,
                user=CommentUser(
                    id=comment.user.id,
                    display_name=comment.user.display_name,
                    reputation=comment.user.reputation,
                    badges=comment.user.badges or [],
                ),
                parent_id=comment.parent_id,
                content=comment.content,
                like_count=comment.like_count,
                is_edited=comment.is_edited,
                is_deleted=comment.is_deleted,
                created_at=comment.created_at,
                updated_at=comment.updated_at,
                reply_count=reply_count,
                replies=nested_replies if nested_replies else None,
                user_liked=False,  # TODO: Implement like tracking
            )
        
        result.append(comment_data)
    
    return result


@router.get("/markets/{market_id}/comments", response_model=CommentListResponse)
async def get_market_comments(
    market_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    parent_id: Optional[str] = Query(None, description="Filter by parent comment ID for nested replies"),
    sort: str = Query("newest", regex="^(newest|oldest)$", description="Sort order"),
    holders_only: bool = Query(False, description="Show only comments from users who have forecasts"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get comments for a market with nested replies
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Items per page (default: 20, max: 100)
    - parent_id: Filter by parent comment ID (for loading nested replies)
    - sort: Sort order - "newest" or "oldest" (default: newest)
    - holders_only: Show only comments from users with forecasts (default: false)
    """
    # Verify market exists
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Build base query
    query = db.query(Comment).filter(
        Comment.market_id == market_id,
        Comment.is_deleted == False,
    )
    
    # Filter by parent_id
    if parent_id:
        query = query.filter(Comment.parent_id == parent_id)
    else:
        # Top-level comments only
        query = query.filter(Comment.parent_id.is_(None))
    
    # Filter by holders only
    if holders_only:
        # Get user IDs who have forecasts on this market
        holder_ids = db.query(Forecast.user_id).filter(
            Forecast.market_id == market_id
        ).distinct().all()
        holder_ids = [h[0] for h in holder_ids]
        if holder_ids:
            query = query.filter(Comment.user_id.in_(holder_ids))
        else:
            # No holders, return empty
            return {
                "success": True,
                "data": {
                    "comments": [],
                    "total": 0,
                    "page": page,
                    "limit": limit,
                    "pages": 0,
                },
                "errors": None,
            }
    
    # Get total count
    total = query.count()
    
    # Apply sorting
    if sort == "oldest":
        query = query.order_by(Comment.created_at.asc())
    else:
        query = query.order_by(Comment.created_at.desc())
    
    # Apply pagination
    offset = (page - 1) * limit
    comments = query.options(
        joinedload(Comment.user),
    ).offset(offset).limit(limit).all()
    
    # Load nested replies for each comment
    for comment in comments:
        # Load direct replies
        replies = db.query(Comment).filter(
            Comment.parent_id == comment.id,
            Comment.is_deleted == False,
        ).options(
            joinedload(Comment.user),
        ).order_by(Comment.created_at.asc()).all()
        comment.replies = replies
    
    # Build nested structure
    current_user_id = current_user.id if current_user else None
    comment_responses = build_comment_tree(comments, current_user_id)
    
    # Calculate pages
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "comments": [c.model_dump() for c in comment_responses],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
        },
        "errors": None,
    }


@router.post("/markets/{market_id}/comments", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_comment(
    market_id: str,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new comment or reply
    
    Body:
    - content: Comment text (required)
    - parent_id: Parent comment ID for replies (optional)
    """
    # Verify market exists
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Validate content length
    if len(comment_data.content.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment content cannot be empty",
        )
    
    if len(comment_data.content) > MAX_COMMENT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Comment content exceeds maximum length of {MAX_COMMENT_LENGTH} characters",
        )
    
    # If parent_id is provided, validate it exists and belongs to this market
    parent_comment = None
    if comment_data.parent_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment_data.parent_id,
            Comment.market_id == market_id,
            Comment.is_deleted == False,
        ).first()
        
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found",
            )
        
        # Check nesting depth
        depth = 1
        temp_parent = parent_comment
        while temp_parent.parent_id:
            depth += 1
            temp_parent = db.query(Comment).filter(Comment.id == temp_parent.parent_id).first()
            if not temp_parent:
                break
            if depth >= MAX_NESTING_DEPTH:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Maximum nesting depth of {MAX_NESTING_DEPTH} reached",
                )
    
    # Create comment
    comment = Comment(
        id=str(uuid_module.uuid4()),
        market_id=market_id,
        user_id=current_user.id,
        parent_id=comment_data.parent_id,
        content=comment_data.content.strip(),
        like_count=0,
        is_edited=False,
        is_deleted=False,
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Load user relationship
    db.refresh(comment, ["user"])
    
    # Build response
    comment_response = CommentResponse(
        id=comment.id,
        market_id=comment.market_id,
        user=CommentUser(
            id=comment.user.id,
            display_name=comment.user.display_name,
            reputation=comment.user.reputation,
            badges=comment.user.badges or [],
        ),
        parent_id=comment.parent_id,
        content=comment.content,
        like_count=comment.like_count,
        is_edited=comment.is_edited,
        is_deleted=comment.is_deleted,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        reply_count=0,
        replies=None,
        user_liked=False,
    )
    
    return {
        "success": True,
        "data": {
            "comment": comment_response.model_dump(),
        },
        "errors": None,
    }


@router.patch("/comments/{comment_id}", response_model=dict)
async def update_comment(
    comment_id: str,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a comment (only by the author)
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    
    # Check ownership
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments",
        )
    
    # Validate content
    if len(comment_data.content.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment content cannot be empty",
        )
    
    if len(comment_data.content) > MAX_COMMENT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Comment content exceeds maximum length of {MAX_COMMENT_LENGTH} characters",
        )
    
    # Update comment
    comment.content = comment_data.content.strip()
    comment.is_edited = True
    
    db.commit()
    db.refresh(comment)
    db.refresh(comment, ["user"])
    
    # Build response
    comment_response = CommentResponse(
        id=comment.id,
        market_id=comment.market_id,
        user=CommentUser(
            id=comment.user.id,
            display_name=comment.user.display_name,
            reputation=comment.user.reputation,
            badges=comment.user.badges or [],
        ),
        parent_id=comment.parent_id,
        content=comment.content,
        like_count=comment.like_count,
        is_edited=comment.is_edited,
        is_deleted=comment.is_deleted,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        reply_count=len([r for r in comment.replies if not r.is_deleted]),
        replies=None,
        user_liked=False,
    )
    
    return {
        "success": True,
        "data": {
            "comment": comment_response.model_dump(),
        },
        "errors": None,
    }


@router.delete("/comments/{comment_id}", response_model=dict)
async def delete_comment(
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft delete a comment (only by the author or admin/moderator)
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    
    # Check permissions
    if comment.user_id != current_user.id and not (current_user.is_admin or current_user.is_market_moderator):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments",
        )
    
    # Soft delete
    comment.is_deleted = True
    
    db.commit()
    
    return {
        "success": True,
        "data": {
            "message": "Comment deleted successfully",
        },
        "errors": None,
    }


@router.get("/markets/{market_id}/comments/count", response_model=dict)
async def get_comment_count(
    market_id: str,
    db: Session = Depends(get_db),
):
    """
    Get total comment count for a market (for tab display)
    """
    count = db.query(Comment).filter(
        Comment.market_id == market_id,
        Comment.is_deleted == False,
        Comment.parent_id.is_(None),  # Only count top-level comments
    ).count()
    
    return {
        "success": True,
        "data": {
            "count": count,
        },
        "errors": None,
    }
