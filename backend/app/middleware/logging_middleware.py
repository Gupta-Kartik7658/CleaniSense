import time
import uuid
import logging
from typing import Optional
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from fastapi import Request, Response

# Context variable to hold request_id for logging correlation
request_id_ctx_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)

logger = logging.getLogger("uvicorn")

class RequestIDFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_ctx_var.get() or "no-request-id"
        return True

# Apply custom request id filter and formatting to handlers on startup
logger.addFilter(RequestIDFilter())
for handler in logger.handlers:
    handler.addFilter(RequestIDFilter())
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [RID:%(request_id)s] %(message)s"
    )
    handler.setFormatter(formatter)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """
        Intercepts requests to track request duration, correlation ID, and logging metrics.
        """
        request_id = request.headers.get("X-Request-ID") or request.headers.get("x-request-id")
        if not request_id:
            request_id = str(uuid.uuid4())

        # Set request ID in context variables
        token = request_id_ctx_var.set(request_id)
        start_time = time.time()
        
        logger.info(f"Started {request.method} {request.url.path}")

        try:
            response = await call_next(request)
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            user_id = getattr(request.state, "user_id", "anonymous")
            logger.error(f"Failed {request.method} {request.url.path} - User:{user_id} - Duration:{process_time:.2f}ms - Error:{e}")
            raise e
        else:
            process_time = (time.time() - start_time) * 1000
            user_id = getattr(request.state, "user_id", "anonymous")
            logger.info(
                f"Finished {request.method} {request.url.path} - Status:{response.status_code} - User:{user_id} - Duration:{process_time:.2f}ms"
            )
            # Inject X-Request-ID correlation header in the client response
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            # Clean up context thread variable
            request_id_ctx_var.reset(token)
