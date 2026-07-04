import logging
import traceback
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("uvicorn")

async def global_exception_handler(request: Request, exc: Exception) -> Response:
    """
    Catches all unhandled exceptions globally and formats them to the standard envelope.
    """
    # 1. Handle HTTPExceptions
    if isinstance(exc, StarletteHTTPException):
        error_code = "HTTP_ERROR"
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            error_code = "NOT_FOUND"
        elif exc.status_code == status.HTTP_401_UNAUTHORIZED:
            error_code = "UNAUTHORIZED"
        elif exc.status_code == status.HTTP_403_FORBIDDEN:
            error_code = "FORBIDDEN"
        elif exc.status_code == status.HTTP_409_CONFLICT:
            error_code = "CONFLICT"

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.detail,
                "error": {
                    "code": error_code,
                    "details": None
                }
            }
        )

    # 2. Handle Pydantic request validation exceptions
    if isinstance(exc, RequestValidationError):
        details = []
        for error in exc.errors():
            loc = error.get("loc", [])
            field = str(loc[-1]) if loc else "unknown"
            details.append({
                "field": field,
                "message": error.get("msg", "Invalid value")
            })

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "Input validation failed",
                "error": {
                    "code": "VALIDATION_ERROR",
                    "details": details
                }
            }
        )

    # 3. Handle unhandled internal service exceptions
    # Log traceback correlation
    logger.error(f"Unhandled Exception: {str(exc)}\n{traceback.format_exc()}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected internal server error occurred.",
            "error": {
                "code": "INTERNAL_ERROR",
                "details": None
            }
        }
    )
