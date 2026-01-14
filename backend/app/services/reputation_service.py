"""
Reputation calculation service
"""
import math
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models.forecast import Forecast
from app.models.market import Market, Outcome


def calculate_brier_score(forecasts: List[Forecast], markets: Dict[str, Market]) -> float:
    """
    Calculate Brier score for a user's forecasts (simplified for MVP)
    
    For MVP, we use a simplified approach:
    - If user forecasted the winning outcome: probability = 1.0, outcome = 1.0 → Brier = 0
    - If user forecasted the losing outcome: probability = 0.0, outcome = 0.0 → Brier = 0
    - But we need their probability estimate, so we use market consensus at resolution
    
    Simplified: Use win rate as accuracy (for MVP)
    Returns accuracy score (0-1, higher is better)
    """
    if not forecasts:
        return 0.0
    
    resolved_forecasts = [f for f in forecasts if f.status in ['won', 'lost']]
    if not resolved_forecasts:
        return 0.0
    
    # Calculate win rate (simplified accuracy)
    won_count = sum(1 for f in resolved_forecasts if f.status == 'won')
    accuracy_score = won_count / len(resolved_forecasts)
    
    return accuracy_score


def calculate_reputation(
    db: Session,
    user_id: str,
    accuracy_score: Optional[float] = None,
    total_forecast_points: Optional[int] = None
) -> float:
    """
    Calculate user reputation score
    
    Formula: reputation = 0.7 * accuracy_score + 0.3 * log(1 + total_forecast_points)
    - Accuracy score: 0-1 (from Brier score)
    - Total forecast points: sum of all points user has allocated
    - Result: 0-100 scale
    
    Args:
        db: Database session
        user_id: User ID
        accuracy_score: Pre-calculated accuracy (optional, will calculate if None)
        total_forecast_points: Pre-calculated total points (optional, will calculate if None)
    
    Returns:
        Reputation score (0-100)
    """
    # Get all resolved forecasts for the user
    forecasts = db.query(Forecast).filter(
        Forecast.user_id == user_id,
        Forecast.status.in_(['won', 'lost'])
    ).all()
    
    if not forecasts:
        return 0.0
    
    # Calculate accuracy if not provided
    if accuracy_score is None:
        # Get all markets for these forecasts
        market_ids = [f.market_id for f in forecasts]
        markets = {
            market.id: market
            for market in db.query(Market).filter(Market.id.in_(market_ids)).all()
        }
        
        # Load outcomes for each market
        for market in markets.values():
            market.outcomes = db.query(Outcome).filter(Outcome.market_id == market.id).all()
        
        accuracy_score = calculate_brier_score(forecasts, markets)
    
    # Calculate total forecast points if not provided
    if total_forecast_points is None:
        total_forecast_points = sum(f.points for f in forecasts)
    
    # Reputation formula: 0.7 * accuracy + 0.3 * log(1 + total_points)
    # Scale log component to 0-1 range (assuming max ~100,000 points = log(100001) ≈ 11.5)
    # Normalize: log(1 + points) / 12 (roughly maps to 0-1)
    log_component = math.log(1 + total_forecast_points) / 12.0
    log_component = min(1.0, log_component)  # Cap at 1.0
    
    reputation = (0.7 * accuracy_score) + (0.3 * log_component)
    
    # Scale to 0-100
    reputation = reputation * 100.0
    
    # Clamp to 0-100
    return max(0.0, min(100.0, reputation))


def get_user_forecast_stats(db: Session, user_id: str) -> Dict:
    """
    Get user forecast statistics
    
    Returns:
        Dictionary with:
        - total_forecasts: Total number of forecasts
        - resolved_forecasts: Number of resolved forecasts
        - won_forecasts: Number of won forecasts
        - lost_forecasts: Number of lost forecasts
        - total_points: Total points allocated
        - accuracy: Accuracy percentage (0-100)
        - profit_loss: Total profit/loss from resolved forecasts
        - positions_value: Total value of pending forecasts
        - biggest_win: Biggest profit from a single forecast
    """
    all_forecasts = db.query(Forecast).filter(Forecast.user_id == user_id).all()
    resolved_forecasts = [f for f in all_forecasts if f.status in ['won', 'lost']]
    won_forecasts = [f for f in resolved_forecasts if f.status == 'won']
    lost_forecasts = [f for f in resolved_forecasts if f.status == 'lost']
    pending_forecasts = [f for f in all_forecasts if f.status == 'pending']
    
    total_points = sum(f.points for f in all_forecasts)
    
    accuracy = 0.0
    if resolved_forecasts:
        accuracy = (len(won_forecasts) / len(resolved_forecasts)) * 100.0
    
    # Calculate profit/loss
    profit_loss = 0
    for forecast in won_forecasts:
        if forecast.reward_amount:
            profit_loss += (forecast.reward_amount - forecast.points)
        else:
            # Estimate for old forecasts without reward_amount
            profit_loss += int(forecast.points * 0.5)
    
    for forecast in lost_forecasts:
        profit_loss -= forecast.points
    
    # Calculate positions value (pending forecasts)
    positions_value = sum(f.points for f in pending_forecasts)
    
    # Calculate biggest win
    biggest_win = None
    if won_forecasts:
        biggest_win_obj = max(won_forecasts, key=lambda f: 
            (f.reward_amount - f.points) if f.reward_amount 
            else int(f.points * 0.5)
        )
        biggest_win = (biggest_win_obj.reward_amount - biggest_win_obj.points) if biggest_win_obj.reward_amount else int(biggest_win_obj.points * 0.5)
    
    return {
        "total_forecasts": len(all_forecasts),
        "resolved_forecasts": len(resolved_forecasts),
        "won_forecasts": len(won_forecasts),
        "lost_forecasts": len(lost_forecasts),
        "total_points": total_points,
        "accuracy": accuracy,
        "profit_loss": profit_loss,
        "positions_value": positions_value,
        "biggest_win": biggest_win,
    }

