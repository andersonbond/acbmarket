"""
Secure file upload validation: magic-byte checks and extension whitelist.
Do not trust Content-Type or client filename; derive type from file content.
"""
from typing import Tuple, Optional

# Extensions we allow (whitelist). Use the extension returned from validate_image_content.
ALLOWED_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".gif", ".webp")
ALLOWED_AVATAR_EXTENSIONS = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic")


def _match_signature(data: bytes, signature: bytes, offset: int = 0) -> bool:
    return len(data) >= offset + len(signature) and data[offset:offset + len(signature)] == signature


def validate_image_content(file_content: bytes) -> Tuple[bool, Optional[str]]:
    """
    Validate image by magic bytes and return the safe extension to use.
    Returns (is_valid, extension). Extension is one of .jpg, .jpeg, .png, .gif, .webp.
    """
    if not file_content or len(file_content) < 12:
        return False, None

    # JPEG: FF D8 FF
    if _match_signature(file_content, b"\xff\xd8\xff"):
        return True, ".jpg"

    # PNG: 89 50 4E 47 0D 0A 1A 0A
    if _match_signature(file_content, b"\x89PNG\r\n\x1a\n"):
        return True, ".png"

    # GIF: GIF87a or GIF89a
    if _match_signature(file_content, b"GIF87a") or _match_signature(file_content, b"GIF89a"):
        return True, ".gif"

    # WebP: RIFF....WEBP (bytes 0:4 = RIFF, 8:12 = WEBP)
    if _match_signature(file_content, b"RIFF", 0) and _match_signature(file_content, b"WEBP", 8):
        return True, ".webp"

    return False, None


def validate_avatar_content(file_content: bytes) -> Tuple[bool, Optional[str]]:
    """
    Validate avatar image by magic bytes; allows same as validate_image_content plus HEIC/HEIF.
    Returns (is_valid, extension).
    """
    valid, ext = validate_image_content(file_content)
    if valid:
        return True, ext

    # HEIC/HEIF: ftyp at offset 4, then brand at 8 (heic, heix, hevc, mif1, msf1)
    if len(file_content) >= 12 and _match_signature(file_content, b"ftyp", 4):
        brand = file_content[8:12]
        if brand in (b"heic", b"heix", b"hevc", b"mif1", b"msf1"):
            return True, ".heic"

    return False, None
