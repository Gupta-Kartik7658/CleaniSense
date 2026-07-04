import uuid
from datetime import datetime
from pydantic import BaseModel

class HotspotResponse(BaseModel):
    id: uuid.UUID
    title: str
    latitude: float
    longitude: float
    severity: str
    reports_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
