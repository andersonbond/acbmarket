"""
Notification service
"""
import uuid
from typing import List, Dict, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from app.models.notification import Notification
from app.models.user import User
from app.utils.cache import get_cache, set_cache, delete_cache


def create_notification(
    db: Session,
    user_id: str,
    notification_type: str,
    message: str,
    metadata: Optional[Dict] = None
) -> Notification:
    """
    Create a single notification
    
    Returns:
        Created Notification object
    """
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=notification_type,
        message=message,
        read=False,
        meta_data=metadata or {}
    )
    db.add(notification)
    
    # Invalidate cache
    delete_cache(f"notifications:unread_count:{user_id}")
    delete_cache(f"notifications:recent:{user_id}")
    
    return notification


def create_notifications_batch(
    db: Session,
    user_ids: List[str],
    notification_type: str,
    message: str,
    metadata: Optional[Dict] = None
) -> List[Notification]:
    """
    Create notifications for multiple users in batch (optimized)
    
    Returns:
        List of created Notification objects
    """
    notifications = [
        Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=notification_type,
            message=message,
            read=False,
            meta_data=metadata or {}
        )
        for user_id in user_ids
    ]
    
    # Use datetime.now(timezone.utc) instead of func.now() for bulk insert
    # func.now() is a SQLAlchemy function object and can't be adapted by psycopg2
    current_time = datetime.now(timezone.utc)
    
    db.bulk_insert_mappings(Notification, [
        {
            "id": n.id,
            "user_id": n.user_id,
            "type": n.type,
            "message": n.message,
            "read": n.read,
            "meta_data": n.meta_data,
            "created_at": current_time
        }
        for n in notifications
    ])
    
    # Invalidate cache for all affected users
    for user_id in user_ids:
        delete_cache(f"notifications:unread_count:{user_id}")
        delete_cache(f"notifications:recent:{user_id}")
    
    return notifications


def create_forecast_result_notifications(
    db: Session,
    user_results: List[Dict],
    market_id: str,
    market_title: str,
    winning_outcome_name: str,
    batch_size: int = 5000,
    use_async: bool = False
) -> List[Notification]:
    """
    Create individual win/loss notifications for each user after market resolution
    
    Optimized for large-scale operations (100k+ users):
    - Batched bulk inserts to avoid memory issues and long transactions
    - Background processing option for very large batches
    - Efficient cache invalidation
    
    Args:
        db: Database session
        user_results: List of dicts with user_id, won, chips_gained, chips_lost, forecast_points, reward_amount (if won)
        market_id: ID of the resolved market
        market_title: Title of the resolved market
        winning_outcome_name: Name of the winning outcome
        batch_size: Number of notifications to insert per batch (default: 5000)
        use_async: If True and batch is large, use Celery for background processing
    
    Returns:
        List of created Notification objects (empty if async)
    """
    num_users = len(user_results)
    
    # For very large batches (>50k), use async processing if available
    if use_async and num_users > 50000:
        try:
            from app.tasks.notification_tasks import create_notifications_async
            # Queue the task for background processing
            create_notifications_async.delay(
                user_results,
                market_id,
                market_title,
                winning_outcome_name
            )
            return []  # Return immediately, processing happens in background
        except (ImportError, AttributeError):
            # Celery task not available or Celery not configured, fall back to synchronous processing
            # This is fine - the batched approach will still work efficiently
            pass
    
    current_time = datetime.now(timezone.utc)
    all_user_ids = set()
    
    # Process in batches to avoid memory issues and long transactions
    for batch_start in range(0, num_users, batch_size):
        batch_end = min(batch_start + batch_size, num_users)
        batch_results = user_results[batch_start:batch_end]
        
        notifications_batch = []
        
        for result in batch_results:
            user_id = result["user_id"]
            won = result["won"]
            forecast_points = result["forecast_points"]
            all_user_ids.add(user_id)
            
            if won:
                chips_gained = result["chips_gained"]
                reward_amount = result.get("reward_amount", forecast_points + chips_gained)
                notification_type = "forecast_won"
                message = f"🎉 You won! Market '{market_title}' resolved in your favor. You gained ₱{chips_gained:,} chips (total reward: ₱{reward_amount:,})."
                metadata = {
                    "market_id": market_id,
                    "market_title": market_title,
                    "winning_outcome": winning_outcome_name,
                    "forecast_points": forecast_points,
                    "chips_gained": chips_gained,
                    "reward_amount": reward_amount,
                }
            else:
                chips_lost = result["chips_lost"]
                notification_type = "forecast_lost"
                message = f"Market '{market_title}' resolved. Your forecast didn't win. You lost ₱{chips_lost:,} chips."
                metadata = {
                    "market_id": market_id,
                    "market_title": market_title,
                    "winning_outcome": winning_outcome_name,
                    "forecast_points": forecast_points,
                    "chips_lost": chips_lost,
                }
            
            notifications_batch.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "type": notification_type,
                "message": message,
                "read": False,
                "meta_data": metadata,
                "created_at": current_time
            })
        
        # Bulk insert this batch
        if notifications_batch:
            db.bulk_insert_mappings(Notification, notifications_batch)
            db.flush()  # Flush after each batch to avoid huge transaction
    
    # Batch cache invalidation (more efficient than individual calls)
    # Invalidate cache for all affected users at once using a pattern
    # Note: This requires Redis pattern deletion or we can do it in batches
    if all_user_ids:
        # Invalidate cache in batches to avoid blocking
        user_ids_list = list(all_user_ids)
        cache_batch_size = 1000
        
        for cache_batch_start in range(0, len(user_ids_list), cache_batch_size):
            cache_batch_end = min(cache_batch_start + cache_batch_size, len(user_ids_list))
            cache_batch = user_ids_list[cache_batch_start:cache_batch_end]
            
            # Invalidate cache for this batch
            for user_id in cache_batch:
                delete_cache(f"notifications:unread_count:{user_id}")
                delete_cache(f"notifications:recent:{user_id}")
    
    return []


def get_unread_count(db: Session, user_id: str, use_cache: bool = True) -> int:
    """
    Get unread notification count for a user (cached)
    
    Args:
        db: Database session
        user_id: User ID
        use_cache: Whether to use cache (default: True)
    
    Returns:
        Unread count
    """
    cache_key = f"notifications:unread_count:{user_id}"
    
    # Try cache first
    if use_cache:
        cached = get_cache(cache_key)
        if cached is not None:
            return cached
    
    # Query database
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read == False
    ).count()
    
    # Cache result (30 second TTL)
    if use_cache:
        set_cache(cache_key, count, ttl=30)
    
    return count


def get_notifications(
    db: Session,
    user_id: str,
    unread_only: bool = False,
    page: int = 1,
    limit: int = 20,
    notification_type: Optional[str] = None
) -> tuple[List[Notification], int]:
    """
    Get notifications for a user with pagination
    
    Returns:
        Tuple of (notifications list, total count)
    """
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if unread_only:
        query = query.filter(Notification.read == False)
    
    if notification_type:
        query = query.filter(Notification.type == notification_type)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    notifications = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()
    
    return notifications, total


def mark_as_read(db: Session, notification_id: str, user_id: str) -> bool:
    """
    Mark a notification as read
    
    Returns:
        True if successful, False if not found
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if not notification:
        return False
    
    notification.read = True
    
    # Invalidate cache
    delete_cache(f"notifications:unread_count:{user_id}")
    delete_cache(f"notifications:recent:{user_id}")
    
    return True


def mark_all_as_read(db: Session, user_id: str) -> int:
    """
    Mark all notifications as read for a user
    
    Returns:
        Number of notifications marked as read
    """
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.read == False
    ).update({"read": True}, synchronize_session=False)
    
    # Invalidate cache
    delete_cache(f"notifications:unread_count:{user_id}")
    delete_cache(f"notifications:recent:{user_id}")
    
    return count

