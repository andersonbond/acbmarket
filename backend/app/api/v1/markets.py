"""
Market endpoints
"""
import uuid as uuid_module
import os
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import JSONResponse
from starlette.requests import Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from slugify import slugify

from app.database import get_db
from app.models.market import Market, Outcome
from app.models.user import User
from app.schemas.market import (
    MarketCreate,
    MarketUpdate,
    MarketResponse,
    MarketDetailResponse,
    MarketListResponse,
    OutcomeCreate,
)
from app.dependencies import get_current_user, get_current_user_id, require_market_moderator
from app.config import settings

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads/markets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed image MIME types
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB




def generate_unique_slug(db: Session, title: str, existing_slug: Optional[str] = None) -> str:
    """Generate a unique slug from title"""
    base_slug = slugify(title)
    slug = base_slug
    
    # If updating, exclude current market from slug check
    query = db.query(Market).filter(Market.slug == slug)
    if existing_slug:
        query = query.filter(Market.slug != existing_slug)
    
    counter = 1
    while query.first():
        slug = f"{base_slug}-{counter}"
        query = db.query(Market).filter(Market.slug == slug)
        if existing_slug:
            query = query.filter(Market.slug != existing_slug)
        counter += 1
    
    return slug


@router.get("", response_model=MarketListResponse)
async def list_markets(
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """List markets with filters and pagination"""
    query = db.query(Market)
    
    # Apply filters
    if category:
        query = query.filter(Market.category == category)
    
    if status_filter:
        query = query.filter(Market.status == status_filter)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Market.title.ilike(search_term),
                Market.description.ilike(search_term),
            )
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination with eager loading to avoid N+1 queries
    from sqlalchemy.orm import selectinload
    offset = (page - 1) * limit
    # Use selectinload instead of joinedload to avoid duplicate rows and JSONB distinct issues
    # selectinload uses a separate query but doesn't cause duplicate rows
    markets = (
        query.options(selectinload(Market.outcomes))
        .order_by(desc(Market.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    # Include outcomes for each market (already loaded via eager loading)
    market_responses = []
    for market in markets:
        # Safely get end_date (in case migration hasn't been run yet)
        end_date = getattr(market, 'end_date', None)
        
        market_dict = {
            "id": market.id,
            "title": market.title,
            "slug": market.slug,
            "description": market.description,
            "rules": market.rules,
            "image_url": market.image_url,
            "category": market.category,
            "meta_data": market.meta_data or {},
            "max_points_per_user": market.max_points_per_user,
            "end_date": end_date,
            "status": market.status,
            "resolution_outcome": market.resolution_outcome,
            "resolution_time": market.resolution_time,
            "created_by": market.created_by,
            "created_at": market.created_at,
            "updated_at": market.updated_at,
            "outcomes": [
                {
                    "id": outcome.id,
                    "market_id": outcome.market_id,
                    "name": outcome.name,
                    "total_points": outcome.total_points,
                    "created_at": outcome.created_at,
                }
                for outcome in market.outcomes
            ],
        }
        market_responses.append(MarketResponse(**market_dict))
    
    return {
        "success": True,
        "data": {
            "markets": market_responses,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        },
    }


@router.get("/{market_id}/top-holders", response_model=dict)
async def get_market_top_holders(
    market_id: str,
    limit: int = Query(10, ge=1, le=50, description="Number of top holders to return"),
    db: Session = Depends(get_db),
):
    """
    Get top holders for a market (users with largest forecast amounts)
    
    Returns users sorted by their total forecast points on this market
    """
    from app.models.forecast import Forecast
    from sqlalchemy import func
    
    # Verify market exists
    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Get top holders by aggregating forecasts per user
    # Use a single optimized query with subquery to avoid N+1 problem
    from sqlalchemy.orm import joinedload
    
    # First, get total points per user (optimized with index)
    top_holders_subquery = (
        db.query(
            Forecast.user_id,
            func.sum(Forecast.points).label('total_points')
        )
        .filter(Forecast.market_id == market_id)
        .group_by(Forecast.user_id)
        .order_by(func.sum(Forecast.points).desc())
        .limit(limit)
        .subquery()
    )
    
    # Join with users to get user details
    top_holders_query = (
        db.query(
            User.id,
            User.display_name,
            User.avatar_url,
            User.reputation,
            top_holders_subquery.c.total_points
        )
        .join(top_holders_subquery, User.id == top_holders_subquery.c.user_id)
        .order_by(top_holders_subquery.c.total_points.desc())
    )
    
    # Execute query and get results
    results = top_holders_query.all()
    
    # Get all user IDs for batch loading forecasts
    user_ids = [row.id for row in results]
    
    # Batch load all forecasts for these users on this market (single query instead of N queries)
    if user_ids:
        all_forecasts = (
            db.query(Forecast, Outcome.name)
            .join(Outcome, Forecast.outcome_id == Outcome.id)
            .filter(
                Forecast.user_id.in_(user_ids),
                Forecast.market_id == market_id
            )
            .all()
        )
        
        # Group forecasts by user_id
        forecasts_by_user = {}
        for forecast, outcome_name in all_forecasts:
            if forecast.user_id not in forecasts_by_user:
                forecasts_by_user[forecast.user_id] = []
            forecasts_by_user[forecast.user_id].append({
                'outcome_id': forecast.outcome_id,
                'outcome_name': outcome_name,
                'points': forecast.points
            })
    else:
        forecasts_by_user = {}
    
    # Build holders list with outcome details
    holders_list = []
    for i, row in enumerate(results, start=1):
        outcomes = forecasts_by_user.get(row.id, [])
        
        holders_list.append({
            'rank': i,
            'user_id': row.id,
            'display_name': row.display_name,
            'avatar_url': row.avatar_url,
            'reputation': row.reputation,
            'total_points': row.total_points,
            'outcomes': outcomes
        })
    
    return {
        "success": True,
        "data": {
            "holders": holders_list,
        },
    }


@router.get("/{market_id}", response_model=dict)
async def get_market(market_id: str, db: Session = Depends(get_db)):
    """Get market detail with consensus"""
    market = db.query(Market).filter(Market.id == market_id).first()
    
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Calculate consensus
    total_points = sum(outcome.total_points for outcome in market.outcomes)
    consensus = {}
    
    if total_points > 0:
        for outcome in market.outcomes:
            percentage = (outcome.total_points / total_points) * 100
            consensus[outcome.name] = round(percentage, 2)
    
    # Safely get end_date (in case migration hasn't been run yet)
    end_date = getattr(market, 'end_date', None)
    
    market_dict = {
        "id": market.id,
        "title": market.title,
        "slug": market.slug,
        "description": market.description,
        "rules": market.rules,
        "image_url": market.image_url,
        "category": market.category,
        "meta_data": market.meta_data or {},
        "max_points_per_user": market.max_points_per_user,
        "end_date": end_date,
        "status": market.status,
        "resolution_outcome": market.resolution_outcome,
        "resolution_time": market.resolution_time,
        "created_by": market.created_by,
        "created_at": market.created_at,
        "updated_at": market.updated_at,
        "outcomes": [
            {
                "id": outcome.id,
                "market_id": outcome.market_id,
                "name": outcome.name,
                "total_points": outcome.total_points,
                "created_at": outcome.created_at,
            }
            for outcome in market.outcomes
        ],
        "consensus": consensus,
        "total_volume": total_points,
    }
    
    return {
        "success": True,
        "data": {
            "market": MarketDetailResponse(**market_dict),
        },
    }


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_market(
    market_data: MarketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_market_moderator),
):
    """Create a new market (market moderator or admin only)"""
    # Generate slug
    slug = generate_unique_slug(db, market_data.title)
    
    # Create market
    market = Market(
        id=str(uuid_module.uuid4()),
        title=market_data.title,
        slug=slug,
        description=market_data.description,
        rules=market_data.rules,
        image_url=market_data.image_url,
        category=market_data.category,
        meta_data=market_data.meta_data or {},
        max_points_per_user=market_data.max_points_per_user,
        end_date=market_data.end_date,
        created_by=current_user.id,
        status="open",
    )
    
    db.add(market)
    db.flush()  # Get market ID
    
    # Create outcomes
    for outcome_data in market_data.outcomes:
        outcome = Outcome(
            id=str(uuid_module.uuid4()),
            market_id=market.id,
            name=outcome_data.name,
            total_points=0,
        )
        db.add(outcome)
    
    db.commit()
    db.refresh(market)
    
    # Create activity for market creation
    from app.services.activity_service import create_activity
    create_activity(
        db,
        activity_type="market_created",
        user_id=current_user.id,
        market_id=market.id,
        metadata={
            "market_title": market.title,
            "category": market.category,
        }  # Will be stored as meta_data
    )
    db.commit()  # Commit activity
    
    # Return created market
    # Safely get end_date (in case migration hasn't been run yet)
    end_date = getattr(market, 'end_date', None)
    
    market_dict = {
        "id": market.id,
        "title": market.title,
        "slug": market.slug,
        "description": market.description,
        "rules": market.rules,
        "image_url": market.image_url,
        "category": market.category,
        "meta_data": market.meta_data or {},
        "max_points_per_user": market.max_points_per_user,
        "end_date": end_date,
        "status": market.status,
        "resolution_outcome": market.resolution_outcome,
        "resolution_time": market.resolution_time,
        "created_by": market.created_by,
        "created_at": market.created_at,
        "updated_at": market.updated_at,
        "outcomes": [
            {
                "id": outcome.id,
                "market_id": outcome.market_id,
                "name": outcome.name,
                "total_points": outcome.total_points,
                "created_at": outcome.created_at,
            }
            for outcome in market.outcomes
        ],
    }
    
    return {
        "success": True,
        "data": {
            "market": MarketResponse(**market_dict),
        },
        "message": "Market created successfully",
    }


@router.patch("/{market_id}", response_model=dict)
async def update_market(
    market_id: str,
    market_data: MarketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_market_moderator),
):
    """Update a market (market moderator or admin only)"""
    market = db.query(Market).filter(Market.id == market_id).first()
    
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Update fields
    if market_data.title is not None:
        market.title = market_data.title
        # Regenerate slug if title changed
        market.slug = generate_unique_slug(db, market_data.title, existing_slug=market.slug)
    
    if market_data.description is not None:
        market.description = market_data.description
    
    if market_data.rules is not None:
        market.rules = market_data.rules
    
    if market_data.image_url is not None:
        market.image_url = market_data.image_url
    
    if market_data.category is not None:
        market.category = market_data.category
    
    if market_data.status is not None:
        market.status = market_data.status
    
    if market_data.meta_data is not None:
        market.meta_data = market_data.meta_data
    
    if market_data.max_points_per_user is not None:
        market.max_points_per_user = market_data.max_points_per_user
    
    if market_data.end_date is not None:
        # Safely set end_date (only if column exists)
        if hasattr(market, 'end_date'):
            market.end_date = market_data.end_date
    
    db.commit()
    db.refresh(market)
    
    # Return updated market
    # Safely get end_date (in case migration hasn't been run yet)
    end_date = getattr(market, 'end_date', None)
    
    market_dict = {
        "id": market.id,
        "title": market.title,
        "slug": market.slug,
        "description": market.description,
        "rules": market.rules,
        "image_url": market.image_url,
        "category": market.category,
        "meta_data": market.meta_data or {},
        "max_points_per_user": market.max_points_per_user,
        "end_date": end_date,
        "status": market.status,
        "resolution_outcome": market.resolution_outcome,
        "resolution_time": market.resolution_time,
        "created_by": market.created_by,
        "created_at": market.created_at,
        "updated_at": market.updated_at,
        "outcomes": [
            {
                "id": outcome.id,
                "market_id": outcome.market_id,
                "name": outcome.name,
                "total_points": outcome.total_points,
                "created_at": outcome.created_at,
            }
            for outcome in market.outcomes
        ],
    }
    
    return {
        "success": True,
        "data": {
            "market": MarketResponse(**market_dict),
        },
        "message": "Market updated successfully",
    }


@router.post("/upload-image", response_model=dict)
async def upload_market_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(require_market_moderator),
):
    """Upload market image (market moderator or admin only)"""
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )
    
    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 10MB limit. Current size: {file_size / 1024 / 1024:.2f}MB",
        )
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_filename = f"{uuid_module.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Return full URL (in production, this would be a CDN URL)
    # For development, construct URL from request
    base_url = str(request.base_url).rstrip('/')
    image_url = f"{base_url}/uploads/markets/{unique_filename}"
    
    return {
        "success": True,
        "data": {
            "image_url": image_url,
            "filename": unique_filename,
        },
        "message": "Image uploaded successfully",
    }


@router.get("/{market_id}/history", response_model=dict)
async def get_market_history(
    market_id: str,
    time_range: Optional[str] = Query("all", description="Time range: 1h, 6h, 1d, 1w, 1m, all"),
    db: Session = Depends(get_db),
):
    """
    Get historical consensus data for a market
    
    Reconstructs consensus history from forecast timestamps.
    Returns data points showing how consensus changed over time.
    """
    from app.models.forecast import Forecast
    from datetime import datetime, timedelta, timezone
    
    market = db.query(Market).filter(Market.id == market_id).first()
    
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    
    # Calculate time range
    now = datetime.now(timezone.utc)
    time_ranges = {
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "1d": timedelta(days=1),
        "1w": timedelta(weeks=1),
        "1m": timedelta(days=30),
        "all": None,  # All time
    }
    
    start_time = None
    if time_range.lower() in time_ranges:
        delta = time_ranges[time_range.lower()]
        if delta:
            start_time = now - delta
    else:
        time_range = "all"
    
    # Get all forecasts for this market, ordered by created_at
    query = db.query(Forecast).filter(Forecast.market_id == market_id)
    if start_time:
        # Ensure start_time is timezone-aware for comparison
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
        query = query.filter(Forecast.created_at >= start_time)
    
    forecasts = query.order_by(Forecast.created_at).all()
    
    # Get market creation time as starting point
    market_created = market.created_at
    
    # Initialize outcome totals (start at 0)
    outcome_totals = {outcome.id: 0 for outcome in market.outcomes}
    outcome_names = {outcome.id: outcome.name for outcome in market.outcomes}
    
    # Build history by processing forecasts chronologically
    history_data = []
    
    # Add initial point (market creation, all at 0% or equal distribution)
    # Ensure market_created is timezone-aware for comparison
    market_created_aware = market_created
    if market_created_aware.tzinfo is None:
        market_created_aware = market_created_aware.replace(tzinfo=timezone.utc)
    
    if not start_time or market_created_aware >= start_time:
        total_points = sum(outcome_totals.values())
        consensus = {}
        if total_points > 0:
            for outcome_id, name in outcome_names.items():
                percentage = (outcome_totals[outcome_id] / total_points) * 100
                consensus[name] = round(percentage, 2)
        else:
            # Equal distribution if no points yet
            equal_pct = 100.0 / len(outcome_names) if outcome_names else 0
            for name in outcome_names.values():
                consensus[name] = round(equal_pct, 2)
        
        history_data.append({
            "timestamp": market_created_aware.isoformat(),
            "consensus": consensus,
        })
    
    # Process each forecast chronologically
    for forecast in forecasts:
        # Update outcome totals
        outcome_totals[forecast.outcome_id] += forecast.points
        
        # Calculate consensus at this point
        total_points = sum(outcome_totals.values())
        consensus = {}
        
        if total_points > 0:
            for outcome_id, name in outcome_names.items():
                percentage = (outcome_totals[outcome_id] / total_points) * 100
                consensus[name] = round(percentage, 2)
        else:
            # Equal distribution if no points yet
            equal_pct = 100.0 / len(outcome_names) if outcome_names else 0
            for name in outcome_names.values():
                consensus[name] = round(equal_pct, 2)
        
        history_data.append({
            "timestamp": forecast.created_at.isoformat(),
            "consensus": consensus,
        })
    
    # Add current point if not already included
    if history_data:
        last_point = history_data[-1]
        # Only add if last forecast was more than 1 second ago
        last_timestamp_str = last_point["timestamp"]
        if last_timestamp_str.endswith("Z"):
            last_timestamp = datetime.fromisoformat(last_timestamp_str.replace("Z", "+00:00"))
        else:
            last_timestamp = datetime.fromisoformat(last_timestamp_str)
        
        # Ensure both are timezone-aware for comparison
        if last_timestamp.tzinfo is None:
            last_timestamp = last_timestamp.replace(tzinfo=timezone.utc)
        
        if (now - last_timestamp).total_seconds() > 1:
            # Get current consensus from market
            total_points = sum(outcome.total_points for outcome in market.outcomes)
            current_consensus = {}
            if total_points > 0:
                for outcome in market.outcomes:
                    percentage = (outcome.total_points / total_points) * 100
                    current_consensus[outcome.name] = round(percentage, 2)
            else:
                equal_pct = 100.0 / len(market.outcomes) if market.outcomes else 0
                for outcome in market.outcomes:
                    current_consensus[outcome.name] = round(equal_pct, 2)
            
            history_data.append({
                "timestamp": now.isoformat(),
                "consensus": current_consensus,
            })
    
    return {
        "success": True,
        "data": {
            "market_id": market_id,
            "time_range": time_range,
            "history": history_data,
            "outcomes": [{"id": o.id, "name": o.name} for o in market.outcomes],
        },
    }
