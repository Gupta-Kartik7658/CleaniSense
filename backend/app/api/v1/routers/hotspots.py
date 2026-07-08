from typing import Optional, List
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_admin
from app.models.user import User
from app.schemas.hotspot import HotspotResponse
from app.services.hotspot_service import hotspot_service
from app.utils.response import standard_response, StandardResponseModel

router = APIRouter(prefix="/hotspots", tags=["hotspots"])

@router.get("", response_model=StandardResponseModel, summary="List Environmental Hotspots", description="Retrieves environmental hotspots. Optionally filters by a coordinates proximity radius (km) and hotspot severity level.")
def list_hotspots(
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0),
    radius_km: float = Query(5.0, ge=0.1, le=100.0),
    severity: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get environmental hotspots, with optional proximity radius and severity filters.
    """
    hotspots = hotspot_service.list_hotspots(
        db=db,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        severity=severity
    )
    hotspots_data = [HotspotResponse.model_validate(h) for h in hotspots]
    return standard_response(
        success=True,
        message="Hotspots retrieved successfully",
        data=hotspots_data
    )

@router.post("/refresh", response_model=StandardResponseModel, summary="Refresh Hotspot Clusters", description="Rebuilds active hotspot clusters from current unresolved complaints.")
def refresh_hotspots(
    municipality_id: Optional[uuid.UUID] = Query(None),
    radius_meters: Optional[float] = Query(None, ge=50.0, le=5000.0),
    min_complaints: Optional[int] = Query(None, ge=2, le=25),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    hotspots = hotspot_service.refresh_hotspots(
        db=db,
        municipality_id=municipality_id,
        radius_meters=radius_meters,
        min_complaints=min_complaints,
    )
    hotspots_data = [HotspotResponse.model_validate(h) for h in hotspots]
    return standard_response(
        success=True,
        message="Hotspot clusters refreshed successfully",
        data=hotspots_data,
    )

@router.get("/{id}", response_model=StandardResponseModel, summary="Get Hotspot Details", description="Retrieves detailed attributes of a specific environmental hotspot by its unique ID.")
def get_hotspot_detail(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve single hotspot details.
    """
    hotspot = hotspot_service.get_hotspot(db, id)
    if not hotspot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotspot not found"
        )
        
    hotspot_data = HotspotResponse.model_validate(hotspot)
    return standard_response(
        success=True,
        message="Hotspot details retrieved successfully",
        data=hotspot_data
    )
