"""
Authentication endpoints
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResetPasswordWithOtpRequest,
    SendRegistrationOtpRequest,
    RegisterVerifyOtpRequest,
)
from app.schemas.user import UserResponse
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_reset_token,
)
from app.utils.cache import get_cache, set_cache
from app.services.twilio_service import start_verification, check_verification
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)

router = APIRouter()

# Redis key prefix and TTL for registration OTP rate limit only (OTP state is in Twilio Verify)
REGISTRATION_OTP_SENT_KEY_PREFIX = "registration_otp_sent:"
REGISTRATION_OTP_RATE_LIMIT_TTL = 60  # 1 minute
# Forgot password OTP rate limit
FORGOT_PASSWORD_OTP_SENT_KEY_PREFIX = "forgot_password_otp_sent:"
FORGOT_PASSWORD_OTP_RATE_LIMIT_TTL = 60  # 1 minute


def _create_user_and_return_tokens(
    db: Session,
    email: Optional[str],
    display_name: str,
    contact_number: str,
    hashed_password: str,
) -> dict:
    """Create user and return same response shape as register. Used by register and register_verify_otp."""
    user_id = str(uuid.uuid4())
    new_user = User(
        id=user_id,
        email=email,
        display_name=display_name,
        contact_number=contact_number,
        hashed_password=hashed_password,
        chips=0,
        reputation=0.0,
        rank_score=0.0,
        is_active=True,
        is_verified=False,
        is_admin=False,
        is_market_moderator=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token_data = {"sub": user_id, "email": email or ""}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    return {
        "success": True,
        "data": {
            "user": UserResponse.model_validate(new_user).model_dump(),
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
            },
        },
        "errors": None,
    }


@router.post("/send-registration-otp", response_model=dict)
async def send_registration_otp(
    request: SendRegistrationOtpRequest, db: Session = Depends(get_db)
):
    """Send OTP via Twilio Verify for registration (Philippine +63 numbers). Rate limited per number."""
    # Contact number already validated by schema
    existing_contact = db.query(User).filter(User.contact_number == request.contact_number).first()
    if existing_contact:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Contact number already registered"}],
        }

    rate_limit_key = f"{REGISTRATION_OTP_SENT_KEY_PREFIX}{request.contact_number}"
    if get_cache(rate_limit_key) is not None:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Please wait before requesting another code"}],
        }

    try:
        start_verification(request.contact_number, channel="sms")
    except TwilioRestException as e:
        logger.warning("Twilio Verify start failed: code=%s %s", e.code, e.msg)
        # Trial accounts can only send to verified numbers (21608)
        if e.code == 21608:
            return {
                "success": False,
                "data": None,
                "errors": [{
                    "message": "This number cannot receive codes in test mode. Add it as a verified number in your Twilio Console.",
                }],
            }
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Failed to send verification code. Please try again."}],
        }
    except Exception:
        logger.exception("Twilio Verify start failed for registration OTP")
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Failed to send verification code. Please try again."}],
        }

    set_cache(rate_limit_key, {"sent": True}, ttl=REGISTRATION_OTP_RATE_LIMIT_TTL)
    return {
        "success": True,
        "data": {"message": "Verification code sent"},
        "errors": None,
    }


@router.post("/register-verify-otp", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_verify_otp(
    request: RegisterVerifyOtpRequest, db: Session = Depends(get_db)
):
    """Verify OTP via Twilio Verify and complete registration. Returns same shape as POST /register."""
    if not check_verification(request.contact_number, request.otp):
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid or expired code"}],
        }

    # Same business checks as register
    existing_display_name = db.query(User).filter(User.display_name == request.display_name).first()
    if existing_display_name:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Display name already taken"}],
        }
    existing_contact = db.query(User).filter(User.contact_number == request.contact_number).first()
    if existing_contact:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Contact number already registered"}],
        }

    hashed_password = get_password_hash(request.password)
    return _create_user_and_return_tokens(
        db,
        email=None,
        display_name=request.display_name,
        contact_number=request.contact_number,
        hashed_password=hashed_password,
    )


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """User registration endpoint (no OTP; use send-registration-otp + register-verify-otp for production)."""
    # Check if email is provided and already exists
    if request.email:
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            return {
                "success": False,
                "data": None,
                "errors": [{"message": "Email already registered"}],
            }

    # Check if display name is taken
    existing_display_name = db.query(User).filter(User.display_name == request.display_name).first()
    if existing_display_name:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Display name already taken"}],
        }

    # Check if contact number is already registered
    existing_contact = db.query(User).filter(User.contact_number == request.contact_number).first()
    if existing_contact:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Contact number already registered"}],
        }

    hashed_password = get_password_hash(request.password)
    return _create_user_and_return_tokens(
        db,
        email=request.email,
        display_name=request.display_name,
        contact_number=request.contact_number,
        hashed_password=hashed_password,
    )


@router.post("/login", response_model=dict)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """User login endpoint - uses contact_number instead of email"""
    # Find user by contact_number
    user = db.query(User).filter(User.contact_number == request.contact_number).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid contact number or password"}],
        }
    
    if not user.is_active:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User account is inactive"}],
        }
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Generate tokens (email may be None)
    token_data = {"sub": user.id, "email": user.email or ""}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "success": True,
        "data": {
            "user": UserResponse.model_validate(user).model_dump(),
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
            },
        },
        "errors": None,
    }


@router.post("/refresh", response_model=dict)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh token endpoint"""
    payload = decode_token(request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid refresh token"}],
        }
    
    user_id = payload.get("sub")
    if not user_id:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid token payload"}],
        }
    
    # Verify user exists and is active
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "User not found or inactive"}],
        }
    
    # Generate new access token (email may be None)
    token_data = {"sub": user.id, "email": user.email or ""}
    access_token = create_access_token(token_data)
    
    return {
        "success": True,
        "data": {
            "access_token": access_token,
        },
        "errors": None,
    }


@router.post("/send-forgot-password-otp", response_model=dict)
async def send_forgot_password_otp(
    request: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    """Send OTP via Twilio Verify for forgot password (Philippine +63). Do not reveal if user exists."""
    user = db.query(User).filter(User.contact_number == request.contact_number).first()
    if not user:
        return {
            "success": True,
            "data": {"message": "If the account exists, a reset code has been sent"},
            "errors": None,
        }

    rate_limit_key = f"{FORGOT_PASSWORD_OTP_SENT_KEY_PREFIX}{request.contact_number}"
    if get_cache(rate_limit_key) is not None:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Please wait before requesting another code"}],
        }

    try:
        start_verification(request.contact_number, channel="sms")
    except TwilioRestException as e:
        logger.warning("Twilio Verify start failed (forgot password): code=%s %s", e.code, e.msg)
        if e.code == 21608:
            return {
                "success": False,
                "data": None,
                "errors": [{
                    "message": "This number cannot receive codes in test mode. Add it as a verified number in your Twilio Console.",
                }],
            }
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Failed to send verification code. Please try again."}],
        }
    except Exception:
        logger.exception("Twilio Verify start failed for forgot password OTP")
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Failed to send verification code. Please try again."}],
        }

    set_cache(rate_limit_key, {"sent": True}, ttl=FORGOT_PASSWORD_OTP_RATE_LIMIT_TTL)
    return {
        "success": True,
        "data": {"message": "If the account exists, a reset code has been sent"},
        "errors": None,
    }


@router.post("/reset-password-with-otp", response_model=dict)
async def reset_password_with_otp(
    request: ResetPasswordWithOtpRequest, db: Session = Depends(get_db)
):
    """Reset password after verifying OTP via Twilio Verify."""
    if not check_verification(request.contact_number, request.otp):
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid or expired code"}],
        }

    user = db.query(User).filter(User.contact_number == request.contact_number).first()
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid or expired code"}],
        }

    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {
        "success": True,
        "data": {"message": "Password reset successfully"},
        "errors": None,
    }


@router.post("/forgot-password", response_model=dict)
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Forgot password endpoint - uses contact_number instead of email (deprecated: use send-forgot-password-otp)."""
    user = db.query(User).filter(User.contact_number == request.contact_number).first()

    # Don't reveal if user exists (security best practice)
    if not user:
        return {
            "success": True,
            "data": {"message": "If the account exists, a password reset link has been sent"},
            "errors": None,
        }

    # Generate reset token
    reset_token = generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    db.commit()

    return {
        "success": True,
        "data": {
            "message": "If the account exists, a password reset link has been sent",
            "reset_token": reset_token if db.query(User).count() < 10 else None,
        },
        "errors": None,
    }


@router.post("/reset-password", response_model=dict)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password endpoint"""
    # Find user by reset token
    user = db.query(User).filter(
        User.reset_token == request.token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        return {
            "success": False,
            "data": None,
            "errors": [{"message": "Invalid or expired reset token"}],
        }
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Password reset successfully"},
        "errors": None,
    }
