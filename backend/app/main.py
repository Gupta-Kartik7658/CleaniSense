from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from app.database.session import engine
from app.database.base import Base
from app.core.firebase import initialize_firebase
import logging

# Initialize Firebase Admin SDK
initialize_firebase()

logger = logging.getLogger("uvicorn")

# Automatically create database tables on application start for local development.
# Keep non-database routes available even if the local SQLite file is unhealthy.
try:
    Base.metadata.create_all(bind=engine)
    from app.database.schema_sync import sync_additive_schema
    sync_additive_schema(engine)
except Exception as exc:
    logger.warning(f"Database bootstrap skipped due to startup error: {exc}")

# Seed master data (categories, municipalities) if missing
from app.database.seed import seed_db
seed_db()

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.exception_handler import global_exception_handler

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Logging middleware registered first to wrap everything
app.add_middleware(LoggingMiddleware)

# CORS configurations — config-driven allowlist; never wildcard in production.
_cors_origins = [
    origin.strip()
    for origin in settings.BACKEND_CORS_ORIGINS.split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, global_exception_handler)
app.add_exception_handler(StarletteHTTPException, global_exception_handler)

# Serve uploaded files static route (only for local storage backend)
import os
from fastapi.staticfiles import StaticFiles
if settings.STORAGE_BACKEND == "local":
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs_url": "/docs",
        "api_v1_version": settings.API_V1_STR
    }
