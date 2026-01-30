"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "ACBMarket API"
    DEBUG: bool = False
    # When False, frontend must use Terminal3 only (no Test / no payment option)
    PAYMENT: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://andersonbondoc@localhost/dev_acbmarket"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = ["https://acbmarket.com"]
    
    # PayMongo (Philippines Payment Gateway)
    PAYMONGO_SECRET_KEY: str = ""
    PAYMONGO_PUBLIC_KEY: str = ""
    PAYMONGO_WEBHOOK_SECRET: str = ""
    
    # Terminal3 (Payment Gateway - supports GCash, ShopeePay, GrabPay, etc.)
    TERMINAL3_API_KEY: str = ""
    # For Checkout API: use TERMINAL3_PROJECT_KEY in iframe URL (error 04 = wrong key if missing).
    # For Widget API only: TERMINAL3_WIDGET_KEY can be used as the iframe key.
    TERMINAL3_PROJECT_KEY: str = ""  # Project key from Merchant Area → My Projects (required for Checkout API)
    TERMINAL3_WIDGET_KEY: str = ""   # Fallback widget key if PROJECT_KEY not set
    TERMINAL3_SECRET_KEY: str = ""   # Secret key from Merchant Area (required to sign widget URL; error 06 without valid sign)
    TERMINAL3_WIDGET_ID: str = "t3_2"  # Widget code from your project's Widgets section (e.g. t3_2, t3_1, p1). Error 06 = wrong code.
    TERMINAL3_DEFAULT_EMAIL: str = "helloacbmarket@gmail.com"  # Fallback when user has no email (Terminal3 requires email for receipts)
    TERMINAL3_PS: str = "test"  # Payment methods: "test" = sandbox (may auto-succeed), "all" = show GCash, cards, etc.
    TERMINAL3_EVALUATION: Optional[int] = 1  # 1 = test/sandbox mode; 0 or unset = live
    TERMINAL3_WEBHOOK_SECRET: str = ""
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Email (optional)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra env vars (e.g. PROD_DATABASE_URL, DEV_DATABASE_URL)


settings = Settings()

# Chip Economy Constants
# IMPORTANT: 1 Chip = 1 Philippine Peso (₱1.00)
# This is for reference and display purposes only.
# Chips are virtual, non-redeemable tokens with no monetary value.
CHIP_TO_PESO_RATIO = 1.0  # 1 chip = ₱1.00

# Chip Reward System Configuration
HOUSE_EDGE_PERCENTAGE = 0.10  # 10% of losing chips kept by house (for promotions/bonuses)
# The remaining (90%) is distributed proportionally to winning users

