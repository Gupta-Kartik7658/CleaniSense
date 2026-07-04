from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.complaint_category import ComplaintCategory
from app.schemas.dashboard import ConfigResponse, CategoryResponse, FeatureFlagsResponse
from app.utils.response import standard_response, StandardResponseModel
from app.core.config import settings
from app.schemas.profile import SUPPORTED_LANGUAGES, SUPPORTED_THEMES

router = APIRouter(prefix="/config", tags=["config"])

@router.get("", response_model=StandardResponseModel, summary="Get Application Configuration", description="Retrieves application version, categories list, supported languages, theme settings, and file upload size/type constraints.")
def get_config(db: Session = Depends(get_db)):
    """
    Get dynamic application configurations, categories, supported languages, and upload constraints.
    """
    categories = db.query(ComplaintCategory).filter(ComplaintCategory.is_active == True).order_by(ComplaintCategory.display_order).all()
    categories_data = [CategoryResponse.model_validate(c) for c in categories]
    
    config_data = ConfigResponse(
        categories=categories_data,
        supported_languages=SUPPORTED_LANGUAGES,
        themes=SUPPORTED_THEMES,
        max_upload_size_mb=10,
        allowed_file_types=["image/jpeg", "image/png", "application/pdf"],
        max_attachments=5,
        app_version=settings.APP_VERSION,
        feature_flags=FeatureFlagsResponse(
            ai_validation=False,
            push_notifications=False,
            rewards=False
        )
    )
    return standard_response(
        success=True,
        message="Application configuration retrieved successfully",
        data=config_data
    )
