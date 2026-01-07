"""
Authentication schemas
"""
from pydantic import BaseModel, EmailStr, Field, validator
import re


class RegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    display_name: str = Field(..., min_length=3, max_length=50)
    contact_number: str = Field(..., description="Contact number in format +63XXXXXXXXXX")
    password: str = Field(..., min_length=8, max_length=100)
    
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
    """User login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

