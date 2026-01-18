"""
PayMongo payment service for Philippines
Supports: Credit/Debit Cards, GCash, PayMaya, Over-the-counter, QR Ph
"""
import base64
import json
import hmac
import hashlib
from typing import Optional, Dict, Any
from app.config import settings


class PayMongoService:
    """Service for handling PayMongo payments"""
    
    BASE_URL = "https://api.paymongo.com/v1"
    
    @staticmethod
    def _get_auth_header() -> str:
        """Get base64 encoded authorization header"""
        api_key = settings.PAYMONGO_SECRET_KEY
        if not api_key:
            raise ValueError("PayMongo secret key not configured")
        encoded = base64.b64encode(f"{api_key}:".encode()).decode()
        return f"Basic {encoded}"
    
    @staticmethod
    def create_payment_intent(
        amount: int,
        currency: str = "PHP",
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Create a PayMongo payment intent
        
        Args:
            amount: Amount in centavos (e.g., 2000 = ₱20.00)
            currency: Currency code (default: PHP)
            metadata: Additional metadata to attach to the payment intent
            
        Returns:
            Payment intent data dictionary
        """
        import httpx
        
        url = f"{PayMongoService.BASE_URL}/payment_intents"
        headers = {
            "Authorization": PayMongoService._get_auth_header(),
            "Content-Type": "application/json",
        }
        
        data = {
            "data": {
                "attributes": {
                    "amount": amount,
                    "currency": currency,
                    "metadata": metadata or {},
                }
            }
        }
        
        try:
            response = httpx.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"PayMongo API error: {str(e)}")
    
    @staticmethod
    def retrieve_payment_intent(payment_intent_id: str) -> Dict[str, Any]:
        """
        Retrieve a payment intent by ID
        
        Args:
            payment_intent_id: PayMongo payment intent ID
            
        Returns:
            Payment intent data dictionary
        """
        import httpx
        
        url = f"{PayMongoService.BASE_URL}/payment_intents/{payment_intent_id}"
        headers = {
            "Authorization": PayMongoService._get_auth_header(),
        }
        
        try:
            response = httpx.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"PayMongo API error: {str(e)}")
    
    @staticmethod
    def attach_payment_method(
        payment_intent_id: str,
        payment_method_id: str,
    ) -> Dict[str, Any]:
        """
        Attach a payment method to a payment intent
        
        Args:
            payment_intent_id: PayMongo payment intent ID
            payment_method_id: Payment method ID from client
            
        Returns:
            Updated payment intent data
        """
        import httpx
        
        url = f"{PayMongoService.BASE_URL}/payment_intents/{payment_intent_id}/attach"
        headers = {
            "Authorization": PayMongoService._get_auth_header(),
            "Content-Type": "application/json",
        }
        
        data = {
            "data": {
                "attributes": {
                    "payment_method": payment_method_id,
                    "return_url": settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:8100",
                }
            }
        }
        
        try:
            response = httpx.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"PayMongo API error: {str(e)}")
    
    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str) -> bool:
        """
        Verify PayMongo webhook signature
        
        Args:
            payload: Raw request body as bytes
            signature: PayMongo signature from request headers
            
        Returns:
            True if signature is valid
            
        Raises:
            ValueError: If signature verification fails
        """
        if not settings.PAYMONGO_WEBHOOK_SECRET:
            raise ValueError("PayMongo webhook secret not configured")
        
        try:
            # PayMongo uses HMAC SHA256
            expected_signature = hmac.new(
                settings.PAYMONGO_WEBHOOK_SECRET.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures using constant-time comparison
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            raise ValueError(f"Signature verification failed: {str(e)}")
    
    @staticmethod
    def create_payment_link(
        amount: int,
        currency: str = "PHP",
        description: str = "",
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Create a PayMongo payment link (for e-wallets like GCash, PayMaya)
        
        Args:
            amount: Amount in centavos
            currency: Currency code (default: PHP)
            description: Payment description
            metadata: Additional metadata
            
        Returns:
            Payment link data dictionary
        """
        import httpx
        
        url = f"{PayMongoService.BASE_URL}/links"
        headers = {
            "Authorization": PayMongoService._get_auth_header(),
            "Content-Type": "application/json",
        }
        
        data = {
            "data": {
                "attributes": {
                    "amount": amount,
                    "currency": currency,
                    "description": description,
                    "metadata": metadata or {},
                }
            }
        }
        
        try:
            response = httpx.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"PayMongo API error: {str(e)}")
