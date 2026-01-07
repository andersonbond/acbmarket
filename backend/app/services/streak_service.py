"""
Streak calculation service
"""
from typing import Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, distinct

from app.models.forecast import Forecast
from app.models.user import User


def calculate_winning_streak(db: Session, user_id: str) -> int:
    """
    Calculate user's current winning streak (consecutive correct forecasts)
    
    Returns:
        Number of consecutive wins (0 if no wins or streak broken)
    """
    # Get all resolved forecasts ordered by creation date (newest first)
    forecasts = db.query(Forecast).filter(
        Forecast.user_id == user_id,
        Forecast.status.in_(['won', 'lost'])
    ).order_by(Forecast.created_at.desc()).all()
    
    if not forecasts:
        return 0
    
    streak = 0
    for forecast in forecasts:
        if forecast.status == 'won':
            streak += 1
        else:
            # Streak broken
            break
    
    return streak


def calculate_activity_streak(db: Session, user_id: str) -> int:
    """
    Calculate user's activity streak (consecutive days with at least 1 forecast)
    
    Returns:
        Number of consecutive days with activity
    """
    # Get all forecasts grouped by date
    today = datetime.utcnow().date()
    streak_days = 0
    
    # Check each day going backwards
    for day_offset in range(365):  # Check up to 1 year
        check_date = today - timedelta(days=day_offset)
        next_date = check_date + timedelta(days=1)
        
        # Count forecasts on this day
        forecast_count = db.query(Forecast).filter(
            Forecast.user_id == user_id,
            Forecast.created_at >= datetime.combine(check_date, datetime.min.time()),
            Forecast.created_at < datetime.combine(next_date, datetime.min.time())
        ).count()
        
        if forecast_count > 0:
            streak_days += 1
        else:
            # Streak broken
            break
    
    return streak_days


def update_user_streaks(db: Session, user_id: str) -> Dict[str, int]:
    """
    Update and return user's streaks
    
    Returns:
        Dictionary with 'winning_streak' and 'activity_streak'
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"winning_streak": 0, "activity_streak": 0}
    
    winning_streak = calculate_winning_streak(db, user_id)
    activity_streak = calculate_activity_streak(db, user_id)
    
    # Update user model if fields exist
    if hasattr(user, 'winning_streak'):
        user.winning_streak = winning_streak
    if hasattr(user, 'activity_streak'):
        user.activity_streak = activity_streak
    
    db.commit()
    
    return {
        "winning_streak": winning_streak,
        "activity_streak": activity_streak,
    }

