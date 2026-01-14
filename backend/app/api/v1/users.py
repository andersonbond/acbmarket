"""
User endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserProfile
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/me", response_model=dict)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile endpoint"""
    # Get forecast stats
    from app.services.reputation_service import get_user_forecast_stats
    stats = get_user_forecast_stats(db, current_user.id)
    
    return {
        "success": True,
        "data": {
            "user": UserProfile.model_validate(current_user).model_dump(),
            "stats": stats,
        },
        "errors": None,
    }


@router.patch("/me", response_model=dict)
async def update_profile(
    request: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update own profile endpoint"""
    # Check if display name is being changed and if it's taken
    if request.display_name and request.display_name != current_user.display_name:
        existing_user = db.query(User).filter(
            User.display_name == request.display_name,
            User.id != current_user.id
        ).first()
        if existing_user:
            return {
                "success": False,
                "data": None,
                "errors": [{"message": "Display name already taken"}],
            }
        current_user.display_name = request.display_name
    
    # Update bio if provided
    if request.bio is not None:
        current_user.bio = request.bio
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "success": True,
        "data": {
            "user": UserProfile.model_validate(current_user).model_dump(),
        },
        "errors": None,
    }


@router.get("/{user_id}/profile", response_model=dict)
async def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Get user profile endpoint (public)"""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found"}],
        }
    
    # Get forecast stats
    from app.services.reputation_service import get_user_forecast_stats
    stats = get_user_forecast_stats(db, user_id)
    
    return {
        "success": True,
        "data": {
            "user": UserResponse.model_validate(user).model_dump(),
            "stats": stats,
        },
        "errors": None,
    }


@router.get("/{user_id}/badges", response_model=dict)
async def get_user_badges(user_id: str, db: Session = Depends(get_db)):
    """Get user badges endpoint"""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found"}],
        }
    
    from app.services.badge_service import get_user_badges as get_badges
    badges = get_badges(user)
    
    return {
        "success": True,
        "data": {
            "badges": badges,
        },
        "errors": None,
    }


@router.post("/{user_id}/badges/check", response_model=dict)
async def check_user_badges(user_id: str, db: Session = Depends(get_db)):
    """Manually check and award badges for a user (useful for retroactive badge awarding)"""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found"}],
        }
    
    from app.services.badge_service import check_and_award_badges, get_user_badges as get_badges
    from app.models.forecast import Forecast
    
    # Get current forecast count for info
    forecast_count = db.query(Forecast).filter(Forecast.user_id == user_id).count()
    
    # Check and award badges
    newly_awarded = check_and_award_badges(db, user_id)
    
    # Refresh user to get updated badges
    db.refresh(user)
    
    # Get formatted badges
    badges = get_badges(user)
    
    return {
        "success": True,
        "data": {
            "forecast_count": forecast_count,
            "newly_awarded": newly_awarded,
            "badges": badges,
        },
        "errors": None,
    }


@router.get("/{user_id}/reputation-history", response_model=dict)
async def get_reputation_history(
    user_id: str,
    db: Session = Depends(get_db),
    limit: int = 100
):
    """Get reputation history endpoint"""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found"}],
        }
    
    from app.models.reputation_history import ReputationHistory
    from sqlalchemy import desc
    
    history = db.query(ReputationHistory).filter(
        ReputationHistory.user_id == user_id
    ).order_by(desc(ReputationHistory.created_at)).limit(limit).all()
    
    history_data = [
        {
            "reputation": h.reputation,
            "accuracy_score": h.accuracy_score,
            "total_forecast_points": h.total_forecast_points,
            "created_at": h.created_at.isoformat(),
        }
        for h in history
    ]
    
    return {
        "success": True,
        "data": {
            "history": history_data,
        },
        "errors": None,
    }
