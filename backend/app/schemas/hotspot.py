import uuid
from datetime import datetime
from pydantic import BaseModel

class HotspotResponse(BaseModel):
    id: uuid.UUID
    title: str
    latitude: float
    longitude: float
    severity: str
    severity_score: float | None = None
    radius_meters: float | None = None
    reports_count: int
    complaint_ids: str | None = None
    dominant_category: str | None = None
    trend: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
