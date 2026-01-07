"""
Leaderboard endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_optional
from app.models.user import User
from app.services.leaderboard_service import (
    get_cached_leaderboard,
    get_user_rank,
    invalidate_leaderboard_cache,
)

router = APIRouter()


@router.get("", response_model=dict)
async def get_leaderboard(
    period: str = Query("global", description="Period: global, weekly, or monthly"),
    category: Optional[str] = Query("all", description="Market category filter (all for all categories)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get leaderboard with optional period and category filtering
    
    Query Parameters:
    - period: "global", "weekly", or "monthly" (default: global)
    - category: Market category or "all" (default: all)
    - page: Page number (default: 1)
    - limit: Results per page (default: 50, max: 100)
    
    Returns:
    - leaderboard: List of ranked users
    - user_rank: Current user's rank (if authenticated)
    - pagination: Pagination metadata
    """
    # Validate period
    if period not in ["global", "weekly", "monthly"]:
        period = "global"
    
    # Normalize category
    if category == "all" or category is None:
        category = None
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Get leaderboard (get more than needed for pagination)
    leaderboard = get_cached_leaderboard(db, period, category, limit=1000)
    
    # Apply pagination
    total = len(leaderboard)
    paginated_leaderboard = leaderboard[offset:offset + limit]
    
    # Get user's rank if authenticated
    user_rank = None
    if current_user:
        user_rank = get_user_rank(db, current_user.id, period, category)
    
    # Calculate pagination metadata
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "leaderboard": paginated_leaderboard,
            "user_rank": user_rank,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages,
            },
        },
        "errors": None,
    }


@router.post("/invalidate", response_model=dict)
async def invalidate_cache(
    period: Optional[str] = Query(None, description="Period to invalidate (all if not specified)"),
    category: Optional[str] = Query(None, description="Category to invalidate (all if not specified)"),
):
    """
    Invalidate leaderboard cache (admin only - can be added later)
    
    For now, this is a simple endpoint. In production, add admin authentication.
    """
    invalidate_leaderboard_cache(period, category)
    
    return {
        "success": True,
        "data": {"message": "Leaderboard cache invalidated"},
        "errors": None,
    }

