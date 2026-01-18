"""
Activity feed endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_optional
from app.models.user import User
from app.models.activity import Activity
from app.models.market import Market
from app.schemas.activity import ActivityResponse, ActivityDetailResponse, ActivityListResponse
from app.services.activity_service import (
    get_user_activity_feed,
    get_global_activity_feed,
)

router = APIRouter()


@router.get("/feed", response_model=dict)
async def get_activity_feed(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    type: Optional[str] = Query(None, description="Filter by activity type"),
    market_id: Optional[str] = Query(None, description="Filter by market ID"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get user's personalized activity feed (requires authentication)
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Results per page (default: 20, max: 100)
    - type: Filter by activity type (optional)
    - market_id: Filter by market ID (optional)
    
    Returns:
    - activities: List of activities
    - pagination: Pagination metadata
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for personalized feed",
        )
    
    activities, total = get_user_activity_feed(
        db, current_user.id, page, limit, type, market_id
    )
    
    # Enrich with user and market names (already loaded via eager loading)
    enriched_activities = []
    for activity in activities:
        activity_dict = ActivityResponse.model_validate(activity).model_dump()
        
        # Add user display name if available (already loaded)
        if activity.user:
            activity_dict["user_display_name"] = activity.user.display_name
        
        # Add market title if available (already loaded)
        if activity.market:
            activity_dict["market_title"] = activity.market.title
        
        enriched_activities.append(activity_dict)
    
    # Calculate pagination
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "activities": enriched_activities,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages,
            },
        },
        "errors": None,
    }


@router.get("/global", response_model=dict)
async def get_global_activity(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Results per page"),
    type: Optional[str] = Query(None, description="Filter by activity type"),
    category: Optional[str] = Query(None, description="Filter by market category"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get global activity feed (public endpoint)
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Results per page (default: 50, max: 100)
    - type: Filter by activity type (optional)
    - category: Filter by market category (optional)
    
    Returns:
    - activities: List of activities
    - pagination: Pagination metadata
    """
    activities, total = get_global_activity_feed(db, page, limit, type, category)
    
    # Enrich with user and market names (already loaded via eager loading)
    enriched_activities = []
    for activity in activities:
        activity_dict = ActivityResponse.model_validate(activity).model_dump()
        
        # Add user display name if available (already loaded)
        if activity.user:
            activity_dict["user_display_name"] = activity.user.display_name
        
        # Add market title if available (already loaded)
        if activity.market:
            activity_dict["market_title"] = activity.market.title
        
        enriched_activities.append(activity_dict)
    
    # Calculate pagination
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "activities": enriched_activities,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages,
            },
        },
        "errors": None,
    }


@router.get("/markets/{market_id}", response_model=dict)
async def get_market_activity(
    market_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    type: Optional[str] = Query(None, description="Filter by activity type"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get activity feed for a specific market (public endpoint)
    
    Query Parameters:
    - market_id: Market ID to get activities for
    - page: Page number (default: 1)
    - limit: Results per page (default: 20, max: 100)
    - type: Filter by activity type (optional)
    
    Returns:
    - activities: List of activities
    - pagination: Pagination metadata
    """
    from sqlalchemy.orm import joinedload
    from sqlalchemy import desc
    
    # Verify market exists
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Query activities for this market with eager loading
    query = db.query(Activity).options(
        joinedload(Activity.user),
        joinedload(Activity.market)
    ).filter(Activity.market_id == market_id)
    
    if type:
        query = query.filter(Activity.activity_type == type)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    activities = query.order_by(desc(Activity.created_at)).offset(offset).limit(limit).all()
    
    # Enrich with user and market names (already loaded via eager loading)
    enriched_activities = []
    for activity in activities:
        activity_dict = ActivityResponse.model_validate(activity).model_dump()
        
        # Add user display name if available (already loaded)
        if activity.user:
            activity_dict["user_display_name"] = activity.user.display_name
        
        # Add market title if available (already loaded)
        if activity.market:
            activity_dict["market_title"] = activity.market.title
        
        enriched_activities.append(activity_dict)
    
    # Calculate pagination
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "activities": enriched_activities,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages,
            },
        },
        "errors": None,
    }


@router.get("/users/{user_id}", response_model=dict)
async def get_user_activity(
    user_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    type: Optional[str] = Query(None, description="Filter by activity type"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get activity feed for a specific user (public endpoint)
    
    Query Parameters:
    - user_id: User ID to get activities for
    - page: Page number (default: 1)
    - limit: Results per page (default: 20, max: 100)
    - type: Filter by activity type (optional)
    
    Returns:
    - activities: List of activities
    - pagination: Pagination metadata
    """
    # Verify user exists
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    activities, total = get_user_activity_feed(
        db, user_id, page, limit, type, None
    )
    
    # Enrich with user and market names (already loaded via eager loading)
    enriched_activities = []
    for activity in activities:
        activity_dict = ActivityResponse.model_validate(activity).model_dump()
        
        # Add user display name if available (already loaded)
        if activity.user:
            activity_dict["user_display_name"] = activity.user.display_name
        
        # Add market title if available (already loaded)
        if activity.market:
            activity_dict["market_title"] = activity.market.title
        
        enriched_activities.append(activity_dict)
    
    # Calculate pagination
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "activities": enriched_activities,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages,
            },
        },
        "errors": None,
    }

