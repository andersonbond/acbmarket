#!/usr/bin/env python3
"""
Seed a local dev user so you can log in without Twilio.

Run from backend directory:
  python scripts/seed_dev_user.py

Login with:
  Contact: +639123456789
  Password: devpassword
"""
import sys
import uuid
from pathlib import Path

# Ensure backend root is on path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

DEV_CONTACT = "+639123456789"
DEV_PASSWORD = "devpassword"
DEV_DISPLAY_NAME = "Dev User"


def main():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.contact_number == DEV_CONTACT).first()
        hashed = get_password_hash(DEV_PASSWORD)
        if existing:
            existing.hashed_password = hashed
            existing.display_name = DEV_DISPLAY_NAME
            existing.is_active = True
            db.commit()
            print(f"Updated dev user: {DEV_CONTACT} / {DEV_DISPLAY_NAME}")
        else:
            user = User(
                id=str(uuid.uuid4()),
                contact_number=DEV_CONTACT,
                display_name=DEV_DISPLAY_NAME,
                hashed_password=hashed,
                email=None,
                is_active=True,
            )
            db.add(user)
            db.commit()
            print(f"Created dev user: {DEV_CONTACT} / {DEV_DISPLAY_NAME}")
        print(f"  -> Login with contact {DEV_CONTACT} and password: {DEV_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
