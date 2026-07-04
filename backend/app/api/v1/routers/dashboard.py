from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.complaint_category import ComplaintCategory
from app.schemas.dashboard import ConfigResponse, CategoryResponse, FeatureFlagsResponse, DashboardResponse
from app.utils.response import standard_response, StandardResponseModel
from app.core.config import settings
from app.schemas.profile import SUPPORTED_LANGUAGES, SUPPORTED_THEMES
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("", response_model=StandardResponseModel, summary="Get Dashboard Overview", description="Retrieves aggregated user statistics, recent reports, local environmental hotspots based on location coordinates, and preferences.")
def get_dashboard(
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated dashboard stats, recent reports, nearby hotspots, and user preferences.
    """
    data = dashboard_service.get_dashboard_data(
        db=db,
        user_id=current_user.id,
        latitude=latitude,
        longitude=longitude
    )
    # Parse data into DashboardResponse structure
    dashboard_data = DashboardResponse.model_validate(data)
    return standard_response(
        success=True,
        message="Dashboard overview data retrieved successfully",
        data=dashboard_data
    )

