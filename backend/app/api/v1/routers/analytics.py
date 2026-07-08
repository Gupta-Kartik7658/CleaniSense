import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_municipality_staff
from app.models.user import User
from app.schemas.dashboard import ComplaintMapData
from app.services.analytics_service import analytics_service
from app.services.complaint_cluster_service import complaint_cluster_service
from app.utils.response import standard_response, StandardResponseModel

# Define separate APIRouters for /analytics and /map resource endpoints
router_analytics = APIRouter(prefix="/analytics", tags=["analytics"])
router_map = APIRouter(prefix="/map", tags=["map"])

@router_analytics.get("", response_model=StandardResponseModel, summary="Get Municipality Analytics", description="Returns status, category, and severity distributions as frontend-ready chart arrays.")
def get_municipality_analytics(
    current_user: User = Depends(require_municipality_staff),
    db: Session = Depends(get_db)
):
    if not current_user.municipality_id:
        raise HTTPException(
            status_code=400,
            detail="Your profile is not linked to any municipality"
        )
        
    municipality_id = current_user.municipality_id
    
    # Query distributions using AnalyticsService
    status_dist = analytics_service.get_status_distribution(db, municipality_id)
    category_dist = analytics_service.get_category_distribution(db, municipality_id)
    severity_dist = analytics_service.get_severity_distribution(db, municipality_id)
    
    analytics_data = {
        "status_distribution": status_dist,
        "category_distribution": category_dist,
        "severity_distribution": severity_dist
    }
    
    return standard_response(
        success=True,
        message="Analytics metrics retrieved successfully",
        data=analytics_data
    )

@router_map.get("", response_model=StandardResponseModel, summary="Get Municipality Map Clusters", description="Retrieves active complaint points and clustered hotspots for rendering on a map.")
def get_municipality_map(
    current_user: User = Depends(require_municipality_staff),
    db: Session = Depends(get_db)
):
    if not current_user.municipality_id:
        raise HTTPException(
            status_code=400,
            detail="Your profile is not linked to any municipality"
        )
        
    map_data = complaint_cluster_service.get_municipality_complaint_map(
        db=db,
        municipality_id=current_user.municipality_id
    )
    
    return standard_response(
        success=True,
        message="Map cluster coordinates retrieved successfully",
        data=ComplaintMapData.model_validate(map_data)
    )
