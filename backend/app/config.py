"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "ACBMarket API"
    DEBUG: bool = False
    
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


settings = Settings()

# Chip Economy Constants
# IMPORTANT: 1 Chip = 1 Philippine Peso (₱1.00)
# This is for reference and display purposes only.
# Chips are virtual, non-redeemable tokens with no monetary value.
CHIP_TO_PESO_RATIO = 1.0  # 1 chip = ₱1.00

# Chip Reward System Configuration
HOUSE_EDGE_PERCENTAGE = 0.10  # 10% of losing chips kept by house (for promotions/bonuses)
# The remaining (90%) is distributed proportionally to winning users

