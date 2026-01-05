"""
Leaderboard endpoints
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def get_leaderboard():
    """Get leaderboard endpoint"""
    return {"message": "Get leaderboard endpoint - to be implemented"}

