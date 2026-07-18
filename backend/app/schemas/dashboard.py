import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.complaint import ComplaintResponse
from app.schemas.hotspot import HotspotResponse
from app.schemas.profile import UserPreferenceBase

class ComplaintMapPoint(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    latitude: float
    longitude: float
    location_name: str
    category_name: Optional[str] = None

class ComplaintHotspotCluster(BaseModel):
    id: str
    latitude: float
    longitude: float
    count: int
    radius_meters: float
    complaint_ids: List[uuid.UUID]
    complaints: List[ComplaintMapPoint]

class ComplaintMapData(BaseModel):
    singles: List[ComplaintMapPoint]
    hotspots: List[ComplaintHotspotCluster]
    total_complaints: int
    hotspot_radius_meters: float = 50.0
    user_complaints: Optional[List[ComplaintMapPoint]] = None

class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    display_order: int

    class Config:
        from_attributes = True

class FeatureFlagsResponse(BaseModel):
    ai_validation: bool = False
    push_notifications: bool = False
    rewards: bool = False

class ConfigResponse(BaseModel):
    categories: List[CategoryResponse]
    supported_languages: List[str]
    themes: List[str]
    max_upload_size_mb: int = 10
    allowed_file_types: List[str] = ["image/jpeg", "image/png", "application/pdf"]
    max_attachments: int = 5
    app_version: str
    feature_flags: FeatureFlagsResponse

class DashboardOverview(BaseModel):
    total_reports: int
    active_reports: int
    resolved_reports: int
    nearby_hotspots: int

class DashboardResponse(BaseModel):
    overview: DashboardOverview
    recent_reports: List[ComplaintResponse]
    nearby_hotspots: List[HotspotResponse]
    complaint_map: ComplaintMapData
    unread_notifications: int
    preferences: UserPreferenceBase

class MunicipalityDashboardOverview(BaseModel):
    total_reports: int
    active_reports: int
    resolved_reports: int
    pending_reports: int

class MunicipalityStatusActivityResponse(BaseModel):
    id: uuid.UUID
    complaint_id: uuid.UUID
    status: str
    remarks: Optional[str] = None
    changed_by: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MunicipalityDashboardResponse(BaseModel):
    overview: MunicipalityDashboardOverview
    recent_complaints: List[ComplaintResponse]
    recent_reports: Optional[List[ComplaintResponse]] = None
    recent_activity: List[MunicipalityStatusActivityResponse]
    complaint_map: Optional[ComplaintMapData] = None
    nearby_hotspots: Optional[List[HotspotResponse]] = None
