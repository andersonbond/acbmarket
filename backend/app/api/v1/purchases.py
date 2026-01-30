"""
Purchase endpoints
"""
import json
import uuid as uuid_module
from typing import Optional
from urllib.parse import parse_qs

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
    
    # Terminal3 payment: Widget (iframe) or Checkout API
    elif provider == "terminal3":
        # Widget/iframe path when project key or widget key is set (Checkout API uses project key in iframe; error 04 = wrong key)
        if settings.TERMINAL3_PROJECT_KEY or settings.TERMINAL3_WIDGET_KEY:
            try:
                purchase = Purchase(
                    id=purchase_id,
                    user_id=current_user.id,
                    amount_cents=amount_cents,
                    chips_added=purchase_data.chips_added,
                    provider="terminal3",
                    provider_tx_id=f"widget_{purchase_id}",
                    status="pending",
                )
                db.add(purchase)
                db.commit()
                db.refresh(purchase)
                # Checkout API expects project key in iframe URL (error 04 = wrong project key)
                iframe_key = settings.TERMINAL3_PROJECT_KEY or settings.TERMINAL3_WIDGET_KEY
                if not iframe_key:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Terminal3 project key not configured (set TERMINAL3_PROJECT_KEY or TERMINAL3_WIDGET_KEY).",
                    )
                # Build signed checkout URL (required by Terminal3; error 06 without valid sign)
                checkout_url_val: Optional[str] = None
                if settings.TERMINAL3_SECRET_KEY:
                    try:
                        reg_ts = int(current_user.created_at.timestamp()) if getattr(current_user, "created_at", None) else 0
                        amount_pesos = purchase_data.chips_added * CHIP_TO_PESO_RATIO
                        checkout_url_val = Terminal3Service.build_digital_goods_widget_url(
                            uid=str(current_user.id),
                            email=current_user.email or settings.TERMINAL3_DEFAULT_EMAIL,
                            registration_date=reg_ts,
                            amount=amount_pesos,
                            currency_code="PHP",
                            product_name=f"{purchase_data.chips_added} Chips",
                            product_id=purchase_id,
                            widget_id=settings.TERMINAL3_WIDGET_ID,
                            ps=settings.TERMINAL3_PS,
                            sign_version=3,
                            evaluation=settings.TERMINAL3_EVALUATION,
                        )
                    except Exception as url_err:
                        db.rollback()
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Failed to build Terminal3 checkout URL: {str(url_err)}",
                        )
                widget_config = {
                    "key": iframe_key,
                    "base_url": "https://payments.terminal3.com/api/",
                    "widget_id": settings.TERMINAL3_WIDGET_ID,
                    "evaluation": settings.TERMINAL3_EVALUATION if settings.TERMINAL3_EVALUATION is not None else 0,
                    "ps": settings.TERMINAL3_PS,
                }
                data: dict = {
                    "purchase": PurchaseResponse.model_validate(purchase),
                    "widget_config": widget_config,
                }
                if checkout_url_val:
                    data["checkout_url"] = checkout_url_val
                return {
                    "success": True,
                    "data": data,
                    "message": "Complete the payment in the widget to receive chips.",
                }
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create purchase: {str(e)}",
                )
        # Checkout API when only TERMINAL3_API_KEY is set
        elif settings.TERMINAL3_API_KEY:
            try:
                checkout_response = Terminal3Service.create_checkout(
                    amount=amount_cents,
                    currency="PHP",
                    description=f"Purchase {purchase_data.chips_added} chips",
                    metadata={
                        "purchase_id": purchase_id,
                        "user_id": current_user.id,
                        "chips_added": str(purchase_data.chips_added),
                    },
                    payment_methods=["gcash"],
                )
                checkout_id = checkout_response.get("id", "")
                checkout_url = checkout_response.get("checkout_url", "")
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
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Terminal3 is not configured (set TERMINAL3_WIDGET_KEY or TERMINAL3_API_KEY).",
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


def _parse_terminal3_pingback_body(body: bytes, content_type: Optional[str]) -> dict:
    """Parse Terminal3 pingback body as JSON or form-encoded."""
    decoded = body.decode("utf-8", errors="replace")
    if content_type and "application/x-www-form-urlencoded" in content_type:
        # Form: key=val&key2=val2 -> flatten single-value lists
        parsed = parse_qs(decoded)
        return {k: (v[0] if len(v) == 1 else v) for k, v in parsed.items()}
    try:
        return json.loads(decoded)
    except json.JSONDecodeError:
        return {}


@router.post("/webhook/terminal3", status_code=status.HTTP_200_OK)
async def terminal3_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_terminal3_signature: Optional[str] = Header(None, alias="x-terminal3-signature"),
):
    """
    Terminal3 pingback (webhook) endpoint.
    Handles Widget test pingback (uid, ref, purchase_id) and Checkout API (event_type, checkout_id).
    """
    try:
        body = await request.body()
        content_type = request.headers.get("content-type") or ""

        # Optional signature verification when secret is set (skip in DEBUG or when secret empty)
        if settings.TERMINAL3_WEBHOOK_SECRET and x_terminal3_signature:
            try:
                if not Terminal3Service.verify_pingback_signature(body, x_terminal3_signature):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid pingback signature",
                    )
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=str(e),
                )

        event_data = _parse_terminal3_pingback_body(body, content_type)
        event_type = event_data.get("type", "")
        # Normalize for comparison (DG sends type=0 or 2 as int or string)
        pingback_type_str = str(event_type) if event_type is not None and event_type != "" else ""
        checkout_id = event_data.get("checkout_id", "")
        metadata = event_data.get("metadata") if isinstance(event_data.get("metadata"), dict) else {}
        # Digital Goods pingback sends goodsid (= ag_external_id = our purchase_id); also allow purchase_id
        purchase_id = (
            event_data.get("purchase_id")
            or event_data.get("goodsid")
            or (metadata.get("purchase_id") if metadata else None)
        )

        # Digital Goods pingback: goodsid + type=0 (success) or type=2 (chargeback)
        if purchase_id and event_type not in ("payment.succeeded", "payment.failed"):
            purchase = db.query(Purchase).filter(
                Purchase.id == purchase_id,
                Purchase.provider == "terminal3",
            ).first()
            if purchase:
                # type=0 or "0" or empty: product purchased → deliver goods (credit user)
                if pingback_type_str in ("0", ""):
                    if purchase.status == "completed":
                        return {"status": "ok", "message": "Already processed (idempotent)"}
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
                # type=2 or "2": chargeback/refund → take goods back
                elif pingback_type_str == "2":
                    if purchase.status == "completed":
                        user = db.query(User).filter(User.id == purchase.user_id).first()
                        if user and user.chips >= purchase.chips_added:
                            user.chips -= purchase.chips_added
                        purchase.status = "refunded"
                        db.commit()
                        return {"status": "ok", "message": "Chargeback processed, chips reverted"}
                    elif purchase.status == "pending":
                        purchase.status = "refunded"
                        db.commit()
                        return {"status": "ok", "message": "Purchase marked as refunded"}
            return {"status": "ok", "message": "Purchase not found"}

        # Checkout API: event_type-based
        if event_type == "payment.succeeded":
            purchase = None
            if checkout_id:
                purchase = db.query(Purchase).filter(
                    Purchase.provider_tx_id == checkout_id,
                    Purchase.status == "pending",
                ).first()
            if not purchase and purchase_id:
                purchase = db.query(Purchase).filter(
                    Purchase.id == purchase_id,
                    Purchase.status == "pending",
                ).first()
            if not purchase:
                return {"status": "ok", "message": "Purchase not found"}
            if purchase.status == "completed":
                return {"status": "ok", "message": "Already processed (idempotent)"}
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

        if event_type == "payment.failed":
            purchase = None
            if checkout_id:
                purchase = db.query(Purchase).filter(
                    Purchase.provider_tx_id == checkout_id,
                    Purchase.status == "pending",
                ).first()
            if not purchase and purchase_id:
                purchase = db.query(Purchase).filter(
                    Purchase.id == purchase_id,
                    Purchase.status == "pending",
                ).first()
            if purchase:
                purchase.status = "failed"
                db.commit()
                return {"status": "ok", "message": "Purchase marked as failed"}

        return {"status": "ok", "message": "Pingback processed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pingback processing error: {str(e)}",
        )
