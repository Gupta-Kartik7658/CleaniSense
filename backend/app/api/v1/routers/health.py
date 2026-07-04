import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from app.api.deps import get_db
from app.core.config import settings
from app.storage import get_storage_client
from app.utils.response import standard_response, StandardResponseModel

router = APIRouter(prefix="/health", tags=["health"])

# Startup time reference
START_TIME = time.time()

@router.get("", response_model=StandardResponseModel)
def health_check(db: Session = Depends(get_db)):
    """
    Check the health status of the application, database, and storage backends.
    Exposes version, environment, and uptime metadata.
    """
    # 1. Check Database connection
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    # 2. Check Storage connection
    storage_status = "connected"
    try:
        storage_client = get_storage_client()
        if settings.STORAGE_BACKEND == "local":
            import os
            if not os.path.exists(settings.UPLOAD_DIR):
                os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        elif settings.STORAGE_BACKEND == "firebase" and not settings.FIREBASE_STORAGE_BUCKET:
            storage_status = "connected (fallback mode)"
    except Exception as e:
        storage_status = f"error: {str(e)}"

    uptime = time.time() - START_TIME

    health_data = {
        "status": "healthy" if db_status == "connected" and "error" not in storage_status else "unhealthy",
        "database": db_status,
        "storage": storage_status,
        "app_version": settings.APP_VERSION,
        "environment": "development" if settings.MOCK_MODE else "production",
        "uptime_seconds": round(uptime, 2)
    }
    
    return standard_response(
        success=health_data["status"] == "healthy",
        message="Application health check completed",
        data=health_data
    )
