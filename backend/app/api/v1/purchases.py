"""
Purchase endpoints
"""
import uuid as uuid_module
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.purchase import Purchase
from app.models.user import User
from app.schemas.purchase import PurchaseCreate, PurchaseResponse, PurchaseListResponse
from app.dependencies import get_current_user
from app.config import CHIP_TO_PESO_RATIO, settings  # Module-level constant
from app.services.paymongo_service import PayMongoService
from app.services.terminal3_service import Terminal3Service

router = APIRouter()

# Purchase limits (for testing)
MIN_CHIPS_PER_PURCHASE = 20  # Minimum ₱20
MAX_CHIPS_PER_PURCHASE = 100000  # Maximum ₱100,000
MAX_DAILY_PURCHASE_LIMIT = 500000  # Maximum ₱500,000 per day


@router.post("/checkout", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_checkout(
    purchase_data: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a chip purchase
    
    Payment providers:
    - 'paymongo': PayMongo payment gateway (supports GCash, PayMaya, Cards, QR Ph)
    - 'terminal3': Terminal3 payment gateway (supports GCash, ShopeePay, GrabPay, Bank Transfers)
    - None: Test mode - immediately credits chips
    
    IMPORTANT: Chips are non-redeemable and have no monetary value.
    """
    # Validate chip amount
    if purchase_data.chips_added < MIN_CHIPS_PER_PURCHASE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum purchase is {MIN_CHIPS_PER_PURCHASE} chips (₱{MIN_CHIPS_PER_PURCHASE})",
        )
    
    if purchase_data.chips_added > MAX_CHIPS_PER_PURCHASE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum purchase is {MAX_CHIPS_PER_PURCHASE} chips (₱{MAX_CHIPS_PER_PURCHASE})",
        )
    
    # Check daily purchase limit
    from datetime import datetime
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_purchases = db.query(Purchase).filter(
        Purchase.user_id == current_user.id,
        Purchase.status == "completed",
        Purchase.created_at >= today_start,
    ).all()
    
    today_total = sum(p.chips_added for p in today_purchases)
    if today_total + purchase_data.chips_added > MAX_DAILY_PURCHASE_LIMIT:
        remaining = MAX_DAILY_PURCHASE_LIMIT - today_total
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Daily purchase limit reached. You can purchase up to {remaining} more chips today.",
        )
    
    # Calculate amount in centavos (1 chip = ₱1.00 = 100 cents)
    amount_cents = int(purchase_data.chips_added * 100 * CHIP_TO_PESO_RATIO)
    
    # Create purchase record
    purchase_id = str(uuid_module.uuid4())
    
    # Route to appropriate payment provider
    provider = purchase_data.payment_provider
    
    # PayMongo payment
    if provider == "paymongo" and settings.PAYMONGO_SECRET_KEY:
        try:
            # Create PayMongo payment intent
            payment_intent_response = PayMongoService.create_payment_intent(
                amount=amount_cents,
                currency="PHP",
                metadata={
                    "purchase_id": purchase_id,
                    "user_id": current_user.id,
                    "chips_added": str(purchase_data.chips_added),
                },
            )
            
            # Extract payment intent data from PayMongo response
            payment_intent_data = payment_intent_response.get("data", {})
            payment_intent_id = payment_intent_data.get("id", "")
            payment_intent_attrs = payment_intent_data.get("attributes", {})
            client_key = payment_intent_attrs.get("client_key", "")
            
            # Create purchase record with pending status
            purchase = Purchase(
                id=purchase_id,
                user_id=current_user.id,
                amount_cents=amount_cents,
                chips_added=purchase_data.chips_added,
                provider="paymongo",
                provider_tx_id=payment_intent_id,
                status="pending",
            )
            
            db.add(purchase)
            db.commit()
            db.refresh(purchase)
            
            return {
                "success": True,
                "data": {
                    "purchase": PurchaseResponse.model_validate(purchase),
                    "payment_intent": {
                        "id": payment_intent_id,
                        "client_key": client_key,
                        "status": payment_intent_attrs.get("status", "awaiting_payment_method"),
                    },
                    "public_key": settings.PAYMONGO_PUBLIC_KEY,
                },
                "message": "Payment intent created. Complete the payment to receive chips.",
            }
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create payment intent: {str(e)}",
            )
    
    # Terminal3 payment
    elif provider == "terminal3" and settings.TERMINAL3_API_KEY:
        try:
            # Create Terminal3 checkout session (restrict to GCash only)
            checkout_response = Terminal3Service.create_checkout(
                amount=amount_cents,
                currency="PHP",
                description=f"Purchase {purchase_data.chips_added} chips",
                metadata={
                    "purchase_id": purchase_id,
                    "user_id": current_user.id,
                    "chips_added": str(purchase_data.chips_added),
                },
                payment_methods=["gcash"],  # Restrict to GCash only
            )
            
            # Extract checkout data from Terminal3 response
            checkout_id = checkout_response.get("id", "")
            checkout_url = checkout_response.get("checkout_url", "")
            
            # Create purchase record with pending status
            purchase = Purchase(
                id=purchase_id,
                user_id=current_user.id,
                amount_cents=amount_cents,
                chips_added=purchase_data.chips_added,
                provider="terminal3",
                provider_tx_id=checkout_id,
                status="pending",
            )
            
            db.add(purchase)
            db.commit()
            db.refresh(purchase)
            
            return {
                "success": True,
                "data": {
                    "purchase": PurchaseResponse.model_validate(purchase),
                    "checkout": {
                        "id": checkout_id,
                        "url": checkout_url,
                        "status": checkout_response.get("status", "pending"),
                    },
                },
                "message": "Checkout session created. Complete the payment to receive chips.",
            }
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create checkout session: {str(e)}",
            )
    
    # Test mode - immediately credit chips
    else:
        # Test mode - immediately credit chips
        purchase = Purchase(
            id=purchase_id,
            user_id=current_user.id,
            amount_cents=amount_cents,
            chips_added=purchase_data.chips_added,
            provider="test",
            provider_tx_id=f"test_{purchase_id}",
            status="completed",
        )
        
        # Atomically: Create purchase + credit chips
        try:
            db.add(purchase)
            current_user.chips += purchase_data.chips_added
            db.commit()
            db.refresh(purchase)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process purchase",
            )
        
        return {
            "success": True,
            "data": {
                "purchase": PurchaseResponse.model_validate(purchase),
                "new_balance": current_user.chips,
            },
            "message": f"Successfully purchased {purchase_data.chips_added} chips (₱{purchase_data.chips_added})",
        }


@router.get("", response_model=dict)
async def get_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
):
    """
    Get user's purchase history
    """
    query = db.query(Purchase).filter(Purchase.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(Purchase.status == status_filter)
    
    total_count = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    purchases = query.order_by(desc(Purchase.created_at)).offset(offset).limit(limit).all()
    
    purchase_responses = [PurchaseResponse.model_validate(p) for p in purchases]
    
    return {
        "success": True,
        "data": {
            "purchases": purchase_responses,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit,
            },
        },
    }


@router.get("/{purchase_id}", response_model=dict)
async def get_purchase(
    purchase_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific purchase by ID
    """
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id,
        Purchase.user_id == current_user.id,
    ).first()
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found",
        )
    
    return {
        "success": True,
        "data": {
            "purchase": PurchaseResponse.model_validate(purchase),
        },
    }


@router.post("/webhook/paymongo", status_code=status.HTTP_200_OK)
async def paymongo_webhook(
    request: Request,
    x_paymongo_signature: str = Header(..., alias="x-paymongo-signature"),
    db: Session = Depends(get_db),
):
    """
    PayMongo webhook endpoint to handle payment events
    
    Handles:
    - payment_intent.succeeded: Credit chips to user
    - payment_intent.failed: Mark purchase as failed
    - payment_intent.payment_failed: Mark purchase as failed
    """
    try:
        # Get raw request body
        body = await request.body()
        
        # Verify webhook signature
        if not PayMongoService.verify_webhook_signature(body, x_paymongo_signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature",
            )
        
        # Parse webhook event
        import json
        event_data = json.loads(body.decode())
        event_type = event_data.get("data", {}).get("attributes", {}).get("type", "")
        
        # Handle payment intent events
        if event_type == "payment_intent.succeeded":
            payment_intent_data = event_data.get("data", {})
            payment_intent_id = payment_intent_data.get("id", "")
            metadata = payment_intent_data.get("attributes", {}).get("metadata", {})
            purchase_id = metadata.get("purchase_id", "")
            
            if not purchase_id:
                return {"status": "ok", "message": "No purchase_id in metadata"}
            
            # Find purchase by provider_tx_id (payment_intent_id)
            purchase = db.query(Purchase).filter(
                Purchase.provider_tx_id == payment_intent_id,
                Purchase.status == "pending",
            ).first()
            
            if not purchase:
                return {"status": "ok", "message": "Purchase not found"}
            
            # Credit chips to user
            user = db.query(User).filter(User.id == purchase.user_id).first()
            if user:
                try:
                    purchase.status = "completed"
                    user.chips += purchase.chips_added
                    db.commit()
                    return {"status": "ok", "message": "Purchase completed and chips credited"}
                except Exception as e:
                    db.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to process purchase: {str(e)}",
                    )
        
        elif event_type in ["payment_intent.failed", "payment_intent.payment_failed"]:
            payment_intent_data = event_data.get("data", {})
            payment_intent_id = payment_intent_data.get("id", "")
            
            # Find purchase and mark as failed
            purchase = db.query(Purchase).filter(
                Purchase.provider_tx_id == payment_intent_id,
                Purchase.status == "pending",
            ).first()
            
            if purchase:
                purchase.status = "failed"
                db.commit()
                return {"status": "ok", "message": "Purchase marked as failed"}
        
        return {"status": "ok", "message": "Webhook processed"}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing error: {str(e)}",
        )


@router.post("/webhook/terminal3", status_code=status.HTTP_200_OK)
async def terminal3_webhook(
    request: Request,
    x_terminal3_signature: str = Header(..., alias="x-terminal3-signature"),
    db: Session = Depends(get_db),
):
    """
    Terminal3 pingback (webhook) endpoint to handle payment events
    
    Handles:
    - payment.succeeded: Credit chips to user
    - payment.failed: Mark purchase as failed
    """
    try:
        # Get raw request body
        body = await request.body()
        
        # Verify pingback signature
        if not Terminal3Service.verify_pingback_signature(body, x_terminal3_signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid pingback signature",
            )
        
        # Parse pingback event
        import json
        event_data = json.loads(body.decode())
        event_type = event_data.get("type", "")
        checkout_id = event_data.get("checkout_id", "")
        metadata = event_data.get("metadata", {})
        purchase_id = metadata.get("purchase_id", "")
        
        # Handle payment success
        if event_type == "payment.succeeded":
            # Find purchase by provider_tx_id (checkout_id) or purchase_id
            purchase = None
            if checkout_id:
                purchase = db.query(Purchase).filter(
                    Purchase.provider_tx_id == checkout_id,
                    Purchase.status == "pending",
                ).first()
            elif purchase_id:
                purchase = db.query(Purchase).filter(
                    Purchase.id == purchase_id,
                    Purchase.status == "pending",
                ).first()
            
            if not purchase:
                return {"status": "ok", "message": "Purchase not found"}
            
            # Credit chips to user
            user = db.query(User).filter(User.id == purchase.user_id).first()
            if user:
                try:
                    purchase.status = "completed"
                    user.chips += purchase.chips_added
                    db.commit()
                    return {"status": "ok", "message": "Purchase completed and chips credited"}
                except Exception as e:
                    db.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to process purchase: {str(e)}",
                    )
        
        # Handle payment failure
        elif event_type == "payment.failed":
            purchase = None
            if checkout_id:
                purchase = db.query(Purchase).filter(
                    Purchase.provider_tx_id == checkout_id,
                    Purchase.status == "pending",
                ).first()
            elif purchase_id:
                purchase = db.query(Purchase).filter(
                    Purchase.id == purchase_id,
                    Purchase.status == "pending",
                ).first()
            
            if purchase:
                purchase.status = "failed"
                db.commit()
                return {"status": "ok", "message": "Purchase marked as failed"}
        
        return {"status": "ok", "message": "Pingback processed"}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pingback processing error: {str(e)}",
        )
