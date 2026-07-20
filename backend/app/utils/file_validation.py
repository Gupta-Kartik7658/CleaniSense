from typing import List
from fastapi import HTTPException, status

ALLOWED_MIME_TYPES: List[str] = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/pjpeg",
    "image/x-png",
    "application/pdf"
]

ALLOWED_IMAGE_MIME_TYPES: List[str] = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/pjpeg",
    "image/x-png"
]

MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

def validate_file(file_size_bytes: int, content_type: str) -> None:
    """
    Validate size and MIME content type of uploaded files.
    """
    if file_size_bytes > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES / (1024*1024)} MB"
        )
        
    normalized_type = (content_type or "").strip().lower()
    if normalized_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File content type '{content_type}' is not supported. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}"
        )

def validate_image_file(file_size_bytes: int, content_type: str) -> None:
    """
    Validate size and MIME content type for image-only analysis endpoints.
    """
    if file_size_bytes > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES / (1024*1024)} MB"
        )

    normalized_type = (content_type or "").strip().lower()
    if normalized_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"File content type '{content_type}' is not supported for image analysis. "
                f"Allowed types: {', '.join(ALLOWED_IMAGE_MIME_TYPES)}"
            )
        )
