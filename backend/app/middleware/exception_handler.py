import logging
import traceback
import json
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

        logger.warning(
            f"HTTPException {exc.status_code} on {request.method} {request.url.path} — {exc.detail}"
        )

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
        # Log the full request body and raw Pydantic errors for debugging
        try:
            body = await request.body()
            body_str = body.decode("utf-8", errors="replace")
            # Truncate very large bodies to 2000 chars for log readability
            if len(body_str) > 2000:
                body_str = body_str[:2000] + "... [TRUNCATED]"
            logger.error(
                f"Validation failed on {request.method} {request.url.path} | "
                f"Body: {body_str}"
            )
        except Exception:
            logger.error(
                f"Validation failed on {request.method} {request.url.path} | "
                f"Body: [unreadable]"
            )

        raw_errors = exc.errors()
        logger.error(
            f"Validation errors: {json.dumps(raw_errors, indent=2, default=str)}"
        )

        details = []
        for error in raw_errors:
            loc = error.get("loc", [])
            field = str(loc[-1]) if loc else "unknown"
            details.append({
                "field": field,
                "message": error.get("msg", "Invalid value"),
                "type": error.get("type", "unknown"),
                "location": [str(l) for l in loc],
                "input": str(error.get("input", ""))[:200]  # truncate huge inputs
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
    logger.error(
        f"Unhandled Exception on {request.method} {request.url.path}: "
        f"{type(exc).__name__}: {str(exc)}\n{traceback.format_exc()}"
    )
    
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
