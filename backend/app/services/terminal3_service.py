"""
Terminal3 payment service
Supports: GCash, ShopeePay, GrabPay, Bank Transfers, Cash-based payments
"""
import base64
import json
import hmac
import hashlib
from typing import Optional, Dict, Any
from app.config import settings


class Terminal3Service:
    """Service for handling Terminal3 payments"""
    
    BASE_URL = "https://api.terminal3.com/v1"  # Update with actual Terminal3 API URL
    
    @staticmethod
    def _get_auth_header() -> str:
        """Get authorization header for Terminal3"""
        api_key = settings.TERMINAL3_API_KEY
        if not api_key:
            raise ValueError("Terminal3 API key not configured")
        # Terminal3 typically uses Bearer token or API key in header
        return f"Bearer {api_key}"
    
    @staticmethod
    def create_checkout(
        amount: int,
        currency: str = "PHP",
        description: str = "",
        metadata: Optional[Dict[str, str]] = None,
        payment_methods: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        Create a Terminal3 checkout session
        
        Args:
            amount: Amount in centavos (e.g., 2000 = ₱20.00)
            currency: Currency code (default: PHP)
            description: Payment description
            metadata: Additional metadata
            payment_methods: List of allowed payment methods (e.g., ['gcash', 'grabpay'])
                           If None, allows all available methods
            
        Returns:
            Checkout session data dictionary
        """
        import httpx
        
        url = f"{Terminal3Service.BASE_URL}/checkout"
        headers = {
            "Authorization": Terminal3Service._get_auth_header(),
            "Content-Type": "application/json",
        }
        
        data = {
            "amount": amount,
            "currency": currency,
            "description": description,
            "metadata": metadata or {},
        }
        
        # If specific payment methods are requested, filter to GCash only
        if payment_methods:
            data["payment_methods"] = payment_methods
        
        try:
            response = httpx.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"Terminal3 API error: {str(e)}")
    
    @staticmethod
    def create_virtual_currency_purchase(
        amount: int,
        currency: str = "PHP",
        price_points: Optional[list] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Create a virtual currency purchase (for chips)
        
        Args:
            amount: Amount in centavos
            currency: Currency code (default: PHP)
            price_points: Predefined price points
            metadata: Additional metadata
            
        Returns:
            Virtual currency purchase data
        """
        import httpx
        
        url = f"{Terminal3Service.BASE_URL}/virtual-currency"
        headers = {
            "Authorization": Terminal3Service._get_auth_header(),
            "Content-Type": "application/json",
        }
        
        data = {
            "amount": amount,
            "currency": currency,
            "metadata": metadata or {},
        }
        
        if price_points:
            data["price_points"] = price_points
        
        try:
            response = httpx.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"Terminal3 API error: {str(e)}")
    
    @staticmethod
    def retrieve_checkout(checkout_id: str) -> Dict[str, Any]:
        """
        Retrieve a checkout session by ID
        
        Args:
            checkout_id: Terminal3 checkout session ID
            
        Returns:
            Checkout session data dictionary
        """
        import httpx
        
        url = f"{Terminal3Service.BASE_URL}/checkout/{checkout_id}"
        headers = {
            "Authorization": Terminal3Service._get_auth_header(),
        }
        
        try:
            response = httpx.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"Terminal3 API error: {str(e)}")
    
    @staticmethod
    def verify_pingback_signature(payload: bytes, signature: str) -> bool:
        """
        Verify Terminal3 pingback (webhook) signature
        
        Args:
            payload: Raw request body as bytes
            signature: Terminal3 signature from request headers
            
        Returns:
            True if signature is valid
            
        Raises:
            ValueError: If signature verification fails
        """
        if not settings.TERMINAL3_WEBHOOK_SECRET:
            raise ValueError("Terminal3 webhook secret not configured")
        
        try:
            # Terminal3 typically uses HMAC SHA256
            expected_signature = hmac.new(
                settings.TERMINAL3_WEBHOOK_SECRET.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures using constant-time comparison
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            raise ValueError(f"Signature verification failed: {str(e)}")
    
    @staticmethod
    def get_payment_methods(country: str = "PH") -> Dict[str, Any]:
        """
        Get available payment methods for a country
        
        Args:
            country: Country code (default: PH for Philippines)
            
        Returns:
            Available payment methods
        """
        import httpx
        
        url = f"{Terminal3Service.BASE_URL}/payment-methods"
        headers = {
            "Authorization": Terminal3Service._get_auth_header(),
        }
        
        params = {"country": country}
        
        try:
            response = httpx.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"Terminal3 API error: {str(e)}")
