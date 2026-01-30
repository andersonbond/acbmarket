"""
Terminal3 payment service
Supports: GCash, ShopeePay, GrabPay, Bank Transfers, Cash-based payments
Uses Terminal3 Digital Goods (onetime payment) API with signed widget URL.
"""
import base64
import json
import hmac
import hashlib
from typing import Optional, Dict, Any
from urllib.parse import urlencode
from app.config import settings


# Terminal3 Widget API base URL for redirect/iframe (onetime payment)
TERMINAL3_WIDGET_BASE = "https://payments.terminal3.com/api/subscription"


class Terminal3Service:
    """Service for handling Terminal3 payments"""
    
    BASE_URL = "https://api.terminal3.com/v1"  # Update with actual Terminal3 API URL

    @staticmethod
    def build_digital_goods_widget_url(
        uid: str,
        email: str,
        registration_date: int,
        amount: float,
        currency_code: str,
        product_name: str,
        product_id: str,
        widget_id: str,
        ps: str = "all",
        sign_version: int = 3,
        success_url: Optional[str] = None,
        failure_url: Optional[str] = None,
        evaluation: Optional[int] = None,
    ) -> str:
        """
        Build a signed Terminal3 Digital Goods (onetime payment) widget URL.
        Required for iframe/redirect; without sign Terminal3 returns error 06.
        See: https://docs.terminal3.com/apis (Onetime payment) and signature-calculation.
        """
        key = settings.TERMINAL3_PROJECT_KEY or settings.TERMINAL3_WIDGET_KEY
        secret = settings.TERMINAL3_SECRET_KEY
        if not key or not secret:
            raise ValueError(
                "Terminal3 key and secret required (TERMINAL3_PROJECT_KEY or TERMINAL3_WIDGET_KEY, TERMINAL3_SECRET_KEY)"
            )
        # Params per Onetime payment API (ag_* = product; history[registration_date] required)
        params: Dict[str, str] = {
            "key": key,
            "uid": uid,
            "widget": widget_id,
            "email": email or "user@example.com",
            "history[registration_date]": str(registration_date),
            "amount": f"{amount:.2f}",
            "currencyCode": currency_code,
            "ag_name": product_name[:256],
            "ag_external_id": product_id[:256],
            "ag_type": "fixed",
            "ps": ps.lower(),
            "sign_version": str(sign_version),
        }
        if success_url:
            params["success_url"] = success_url
        if failure_url:
            params["failure_url"] = failure_url
        if evaluation is not None:
            params["evaluation"] = str(evaluation)
        # Signature: sort params by name, build "key=valuekey2=value2...SECRET", then hash
        sorted_keys = sorted(params.keys())
        base_string = "".join(f"{k}={params[k]}" for k in sorted_keys) + secret
        if sign_version == 3:
            sign = hashlib.sha256(base_string.encode("utf-8")).hexdigest().lower()
        else:
            sign = hashlib.md5(base_string.encode("utf-8")).hexdigest().lower()
        params["sign"] = sign
        return f"{TERMINAL3_WIDGET_BASE}?{urlencode(params)}"

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
