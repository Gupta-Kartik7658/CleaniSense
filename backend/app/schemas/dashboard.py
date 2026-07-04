import uuid
from typing import Optional, List, Dict
from pydantic import BaseModel
from app.schemas.complaint import ComplaintResponse
from app.schemas.hotspot import HotspotResponse
from app.schemas.profile import UserPreferenceBase

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
    unread_notifications: int
    preferences: UserPreferenceBase
