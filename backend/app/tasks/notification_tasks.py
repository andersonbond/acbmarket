"""
Celery tasks for notification processing
Used for large-scale notification creation to avoid blocking API requests
"""
from celery import shared_task
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.notification_service import create_forecast_result_notifications


@shared_task(name="create_notifications_async")
def create_notifications_async(
    user_results: list,
    market_id: str,
    market_title: str,
    winning_outcome_name: str
):
    """
    Async task to create notifications in the background
    
    This task is used when there are many users (>50k) to avoid blocking
    the API request during market resolution.
    
    Args:
        user_results: List of user result dicts
        market_id: Market ID
        market_title: Market title
        winning_outcome_name: Winning outcome name
    """
    db: Session = SessionLocal()
    try:
        create_forecast_result_notifications(
            db,
            user_results,
            market_id,
            market_title,
            winning_outcome_name,
            batch_size=5000,
            use_async=False  # Already in async context
        )
        db.commit()
    except Exception as e:
        db.rollback()
        # Log error (in production, use proper logging)
        print(f"Error creating notifications async: {e}")
        raise
    finally:
        db.close()
