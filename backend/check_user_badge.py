#!/usr/bin/env python3
"""
Script to manually check and award badges for a user
Usage: python check_user_badge.py <user_id>
"""
import sys
from app.database import SessionLocal
from app.services.badge_service import check_and_award_badges, check_newbie_badge
from app.models.user import User
from app.models.forecast import Forecast

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_user_badge.py <user_id>")
        sys.exit(1)
    
    user_id = sys.argv[1]
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"User {user_id} not found")
            sys.exit(1)
        
        # Check forecast count
        forecast_count = db.query(Forecast).filter(Forecast.user_id == user_id).count()
        print(f"User: {user.display_name}")
        print(f"Forecast count: {forecast_count}")
        print(f"Current badges: {user.badges}")
        
        # Check if qualifies for newbie badge
        qualifies = check_newbie_badge(db, user_id)
        print(f"Qualifies for Newbie badge: {qualifies}")
        
        # Check and award badges
        newly_awarded = check_and_award_badges(db, user_id)
        
        if newly_awarded:
            print(f"Newly awarded badges: {newly_awarded}")
            db.refresh(user)
            print(f"Updated badges: {user.badges}")
        else:
            print("No new badges awarded")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
