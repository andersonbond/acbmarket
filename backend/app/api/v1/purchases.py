"""
Purchase endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.post("/checkout")
async def create_checkout():
    """Create payment checkout endpoint"""
    return {"message": "Create checkout endpoint - to be implemented"}


@router.post("/webhook")
async def webhook():
    """Payment webhook endpoint"""
    return {"message": "Webhook endpoint - to be implemented"}


@router.get("")
async def get_purchases():
    """Get user purchases endpoint"""
    return {"message": "Get purchases endpoint - to be implemented"}

