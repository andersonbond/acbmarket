"""
Authentication schemas
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator
import re


class RegisterRequest(BaseModel):
    """User registration request"""
    email: Optional[EmailStr] = None  # Optional email
    display_name: str = Field(..., min_length=3, max_length=50)
    contact_number: str = Field(..., description="Contact number in format +63XXXXXXXXXX")
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('display_name')
    def validate_display_name(cls, v):
        """Validate display name: only alphanumeric characters allowed"""
        if not v:
            raise ValueError('Display name is required')
        v = v.strip()
        if len(v) < 3:
            raise ValueError('Display name must be at least 3 characters')
        if len(v) > 50:
            raise ValueError('Display name must be at most 50 characters')
        # Only allow alphanumeric characters (letters and numbers)
        if not re.match(r'^[a-zA-Z0-9]+$', v):
            raise ValueError('Display name must contain only letters and numbers (no special characters)')
        return v
    
    @validator('contact_number')
    def validate_contact_number(cls, v):
        """Validate contact number: must start with +63 and have 10 digits after"""
        if not v:
            raise ValueError('Contact number is required')
        v = v.strip()
        # Check format: +63 followed by exactly 10 digits
        pattern = r'^\+63\d{10}$'
        if not re.match(pattern, v):
            raise ValueError('Contact number must be in format +63XXXXXXXXXX (e.g., +639123456789)')
        return v


class LoginRequest(BaseModel):
    """User login request - uses contact_number instead of email"""
    contact_number: str = Field(..., description="Contact number in format +63XXXXXXXXXX")
    password: str
    
    @validator('contact_number')
    def validate_contact_number(cls, v):
        """Validate contact number: must start with +63 and have 10 digits after"""
        if not v:
            raise ValueError('Contact number is required')
        v = v.strip()
        # Check format: +63 followed by exactly 10 digits
        pattern = r'^\+63\d{10}$'
        if not re.match(pattern, v):
            raise ValueError('Contact number must be in format +63XXXXXXXXXX (e.g., +639123456789)')
        return v


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request - uses contact_number instead of email"""
    contact_number: str = Field(..., description="Contact number in format +63XXXXXXXXXX")
    
    @validator('contact_number')
    def validate_contact_number(cls, v):
        """Validate contact number: must start with +63 and have 10 digits after"""
        if not v:
            raise ValueError('Contact number is required')
        v = v.strip()
        # Check format: +63 followed by exactly 10 digits
        pattern = r'^\+63\d{10}$'
        if not re.match(pattern, v):
            raise ValueError('Contact number must be in format +63XXXXXXXXXX (e.g., +639123456789)')
        return v


class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class SendRegistrationOtpRequest(BaseModel):
    """Request to send registration OTP to contact number (Philippine +63)"""
    contact_number: str = Field(..., description="Contact number in format +63XXXXXXXXXX")

    @validator("contact_number")
    def validate_contact_number(cls, v):
        if not v:
            raise ValueError("Contact number is required")
        v = v.strip()
        pattern = r"^\+63\d{10}$"
        if not re.match(pattern, v):
            raise ValueError("Contact number must be in format +63XXXXXXXXXX (e.g., +639123456789)")
        return v


class RegisterVerifyOtpRequest(BaseModel):
    """Request to verify OTP and complete registration"""
    contact_number: str = Field(..., description="Contact number in format +63XXXXXXXXXX")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP")
    display_name: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)

    @validator("contact_number")
    def validate_contact_number(cls, v):
        if not v:
            raise ValueError("Contact number is required")
        v = v.strip()
        pattern = r"^\+63\d{10}$"
        if not re.match(pattern, v):
            raise ValueError("Contact number must be in format +63XXXXXXXXXX (e.g., +639123456789)")
        return v

    @validator("display_name")
    def validate_display_name(cls, v):
        if not v:
            raise ValueError("Display name is required")
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Display name must be at least 3 characters")
        if len(v) > 50:
            raise ValueError("Display name must be at most 50 characters")
        if not re.match(r"^[a-zA-Z0-9]+$", v):
            raise ValueError("Display name must contain only letters and numbers (no special characters)")
        return v

    @validator("otp")
    def validate_otp_digits(cls, v):
        if not v or not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be exactly 6 digits")
        return v


class ResetPasswordWithOtpRequest(BaseModel):
    """Request to reset password using OTP (forgot password flow)"""
    contact_number: str = Field(..., description="Contact number in format +63XXXXXXXXXX")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP")
    new_password: str = Field(..., min_length=8, max_length=100)

    @validator("contact_number")
    def validate_contact_number(cls, v):
        if not v:
            raise ValueError("Contact number is required")
        v = v.strip()
        pattern = r"^\+63\d{10}$"
        if not re.match(pattern, v):
            raise ValueError("Contact number must be in format +63XXXXXXXXXX (e.g., +639123456789)")
        return v

    @validator("otp")
    def validate_otp_digits(cls, v):
        if not v or not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be exactly 6 digits")
        return v

