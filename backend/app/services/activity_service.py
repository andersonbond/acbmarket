"""
Activity service
"""
import uuid
from typing import List, Dict, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, desc

from app.models.activity import Activity
from app.models.user import User
from app.models.market import Market
from app.utils.cache import get_cache, set_cache, delete_cache_pattern


def create_activity(
    db: Session,
    activity_type: str,
    user_id: Optional[str] = None,
    market_id: Optional[str] = None,
    metadata: Optional[Dict] = None
) -> Activity:
    """
    Create an activity record
    
    Args:
        db: Database session
        activity_type: Type of activity (forecast_placed, market_resolved, etc.)
        user_id: User ID (None for system/global activities)
        market_id: Market ID (if applicable)
        metadata: Additional data (JSON)
    
    Returns:
        Created Activity object
    """
    activity = Activity(
        id=str(uuid.uuid4()),
        user_id=user_id,
        activity_type=activity_type,
        market_id=market_id,
        meta_data=metadata or {}
    )
    db.add(activity)
    
    # Invalidate global activity cache
    delete_cache_pattern("activity:global:*")
    if user_id:
        delete_cache_pattern(f"activity:feed:{user_id}:*")
    
    return activity


def get_user_activity_feed(
    db: Session,
    user_id: str,
    page: int = 1,
    limit: int = 20,
    activity_type: Optional[str] = None,
    market_id: Optional[str] = None,
    use_cache: bool = True
) -> tuple[List[Activity], int]:
    """
    Get user's personalized activity feed
    
    Optimized with eager loading to avoid N+1 queries.
    
    Returns:
        Tuple of (activities list, total count)
    """
    # Query activities related to user (their activities + markets they follow)
    # For MVP: show user's own activities + global activities
    # Use eager loading to fetch user and market in one query (avoids N+1)
    query = db.query(Activity).options(
        joinedload(Activity.user),
        joinedload(Activity.market)
    ).filter(
        (Activity.user_id == user_id) | (Activity.user_id.is_(None))
    )
    
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)
    
    if market_id:
        query = query.filter(Activity.market_id == market_id)
    
    # Get total count (optimized - use subquery for better performance)
    # For large datasets, consider using estimated count or caching
    total = query.count()
    
    # Apply pagination with eager loading
    offset = (page - 1) * limit
    activities = query.order_by(desc(Activity.created_at)).offset(offset).limit(limit).all()
    
    # Note: Caching Activity objects directly is complex due to SQLAlchemy serialization
    # For now, we'll rely on database query optimization and eager loading
    # Future optimization: Serialize to dict before caching
    return (activities, total)


def get_global_activity_feed(
    db: Session,
    page: int = 1,
    limit: int = 50,
    activity_type: Optional[str] = None,
    category: Optional[str] = None,
    use_cache: bool = True
) -> tuple[List[Activity], int]:
    """
    Get global activity feed (public)
    
    Optimized with eager loading and efficient category filtering.
    
    Returns:
        Tuple of (activities list, total count)
    """
    # Query global activities with eager loading to avoid N+1 queries
    # Use selectinload for better performance with many activities
    query = db.query(Activity).options(
        joinedload(Activity.user),
        joinedload(Activity.market)
    )
    
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)
    
    # If category filter, use subquery for better performance
    # This avoids full table scan when joining
    if category:
        # Get market IDs for this category first (more efficient)
        market_ids = db.query(Market.id).filter(Market.category == category).all()
        market_id_list = [m[0] for m in market_ids]
        if market_id_list:
            query = query.filter(Activity.market_id.in_(market_id_list))
        else:
            # No markets in this category, return empty result
            return [], 0
    
    # Get total count
    # For very large datasets, consider using estimated count or materialized views
    total = query.count()
    
    # Apply pagination with eager loading
    offset = (page - 1) * limit
    activities = query.order_by(desc(Activity.created_at)).offset(offset).limit(limit).all()
    
    # Note: Caching Activity objects directly is complex due to SQLAlchemy serialization
    # For now, we'll rely on database query optimization and eager loading
    # Future optimization: Serialize to dict before caching
    return (activities, total)

