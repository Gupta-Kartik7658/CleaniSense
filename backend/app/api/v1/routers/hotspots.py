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

@router.get("/map", response_model=StandardResponseModel, summary="Get Hotspots Map Clusters")
def get_hotspots_map(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime, timezone
    from app.services.complaint_cluster_service import complaint_cluster_service
    from app.models.hotspot import Hotspot as DBHotspot

    map_clusters = complaint_cluster_service.get_all_complaint_map(db)
    hotspot_service.refresh_hotspots(db)
    db_hotspots = db.query(DBHotspot).filter(DBHotspot.is_active == True).all()
    hotspots_list = []

    for index, h in enumerate(map_clusters.get("hotspots", [])):
        complaints_in_cluster = h.get("complaints", [])
        loc_name = complaints_in_cluster[0].get("location_name", "Local Area") if complaints_in_cluster else "Local Area"
        cat_name = complaints_in_cluster[0].get("category_name", "General") if complaints_in_cluster else "General"
        
        city = "Local Area"
        if loc_name:
            parts = [p.strip() for p in loc_name.split(",") if p.strip()]
            city = parts[-1] if len(parts) > 1 else parts[0]

        hotspots_list.append({
            "id": str(h["id"]),
            "center": {
                "latitude": float(h["latitude"]),
                "longitude": float(h["longitude"]),
                "city": city,
                "district": loc_name,
                "state": ""
            },
            "radius": float(h.get("radius_meters", 500.0)),
            "incidentCount": int(h.get("count", 2)),
            "averageSeverity": 4.2 if int(h.get("count", 2)) >= 3 else 3.2,
            # Use dominant_category (majority category across all complaints), fall back to first complaint
            "dominantType": h.get("dominant_category") or cat_name or "General",
            "trend": "growing" if int(h.get("count", 2)) >= 3 else "stable",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "complaints": complaints_in_cluster
        })

    for h in db_hotspots:
        already_added = any(
            abs(item["center"]["latitude"] - h.latitude) < 0.001 and abs(item["center"]["longitude"] - h.longitude) < 0.001
            for item in hotspots_list
        )
        if not already_added:
            hotspots_list.append({
                "id": str(h.id),
                "center": {
                    "latitude": float(h.latitude),
                    "longitude": float(h.longitude),
                    "city": h.title or "Municipal Hotspot",
                    "district": h.description or "",
                    "state": ""
                },
                "radius": float(h.radius_meters or 500.0),
                "incidentCount": int(h.reports_count or 1),
                "averageSeverity": float(h.severity_score or 3.5),
                "dominantType": h.dominant_category or "General",
                "trend": h.trend or "stable",
                "createdAt": h.created_at.isoformat() if h.created_at else datetime.now(timezone.utc).isoformat(),
                "complaints": []
            })
        
    return standard_response(
        success=True,
        message="Hotspot clusters retrieved successfully",
        data={
            "hotspots": hotspots_list,
            "singles": map_clusters.get("singles", []),
            "total_complaints": map_clusters.get("total_complaints", len(hotspots_list))
        }
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
