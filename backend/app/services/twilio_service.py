"""
Twilio Verify service for registration OTP (Philippine numbers).
No phone number purchase required; uses Twilio Verify API.
"""
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from app.config import settings

logger = logging.getLogger(__name__)


def _get_client() -> Client:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        raise ValueError("Twilio is not configured (missing account SID or auth token)")
    if not settings.TWILIO_VERIFY_SERVICE_SID:
        raise ValueError("Twilio Verify Service SID is not configured")
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def start_verification(to: str, channel: str = "sms") -> None:
    """
    Start a verification: Twilio sends a code to the given E.164 number (e.g. +639123456789).
    Philippine numbers only (+63, 10 digits) should be validated at API layer.
    Raises on failure.
    """
    client = _get_client()
    verification = client.verify.v2.services(
        settings.TWILIO_VERIFY_SERVICE_SID
    ).verifications.create(to=to, channel=channel)
    logger.info("Verify started for %s, sid=%s", to, verification.sid)


def check_verification(to: str, code: str) -> bool:
    """
    Check the user-provided code against Twilio Verify.
    Returns True if status is 'approved', False otherwise (wrong/expired code or max attempts).
    """
    try:
        client = _get_client()
        check = client.verify.v2.services(
            settings.TWILIO_VERIFY_SERVICE_SID
        ).verification_checks.create(to=to, code=code)
        return check.status == "approved"
    except TwilioRestException as e:
        logger.info("Twilio Verify check failed for %s: %s", to, e.msg)
        return False
