import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None

    class Config:
        from_attributes = True

class MunicipalityResponse(BaseModel):
    id: uuid.UUID
    name: str
    district: Optional[str] = None
    state: Optional[str] = None

    class Config:
        from_attributes = True

class AttachmentResponse(BaseModel):
    id: uuid.UUID
    storage_provider: str
    storage_path: str
    public_url: str
    file_type: str
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    upload_source: str
    created_at: datetime

    class Config:
        from_attributes = True

class StatusHistoryResponse(BaseModel):
    id: uuid.UUID
    status: str
    remarks: Optional[str] = None
    changed_by: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ResolutionResponse(BaseModel):
    id: uuid.UUID
    summary: str
    department: str
    officer_name: str
    actions: str
    citizen_remarks: Optional[str] = None
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    date_resolved: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    description: str = Field(..., min_length=20)
    category_id: uuid.UUID
    location_name: str = Field(..., max_length=500)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    municipality_id: Optional[uuid.UUID] = None
    area_affected_sqm: Optional[float] = Field(None, ge=0)
    population_affected: Optional[int] = Field(None, ge=0)
    duration_hours: Optional[float] = Field(None, ge=0)
    survey_data: Optional[dict] = None

class ComplaintCitizenUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=500)
    description: Optional[str] = Field(None, min_length=20)
    category_id: Optional[uuid.UUID] = None
    location_name: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    area_affected_sqm: Optional[float] = Field(None, ge=0)
    population_affected: Optional[int] = Field(None, ge=0)
    duration_hours: Optional[float] = Field(None, ge=0)
    survey_data: Optional[dict] = None

class ComplaintResolveRequest(BaseModel):
    summary: str
    department: str
    officer_name: str
    actions: str
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    remarks: Optional[str] = None

class ComplaintMunicipalityUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_department: Optional[str] = None
    assigned_officer: Optional[str] = None
    resolution: Optional[ComplaintResolveRequest] = None
    remarks: Optional[str] = None

class ComplaintUpdate(BaseModel):
    # Citizen fields
    title: Optional[str] = Field(None, min_length=5, max_length=500)
    description: Optional[str] = Field(None, min_length=20)
    category_id: Optional[uuid.UUID] = None
    location_name: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    area_affected_sqm: Optional[float] = Field(None, ge=0)
    population_affected: Optional[int] = Field(None, ge=0)
    duration_hours: Optional[float] = Field(None, ge=0)
    survey_data: Optional[dict] = None
    
    # Municipal fields
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_department: Optional[str] = None
    assigned_officer: Optional[str] = None
    resolution: Optional[ComplaintResolveRequest] = None
    remarks: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID
    municipality_id: Optional[uuid.UUID] = None
    title: str
    description: str
    status: str
    severity: Optional[str] = None
    severity_score: Optional[float] = None
    image_severity_score: Optional[float] = None
    ai_confidence_score: Optional[float] = None
    survey_score: Optional[float] = None
    weather_score: Optional[float] = None
    density_score: Optional[float] = None
    severity_breakdown: Optional[str] = None
    image_analysis_summary: Optional[str] = None
    area_affected_sqm: Optional[float] = None
    population_affected: Optional[float] = None
    duration_hours: Optional[float] = None
    survey_data: Optional[str] = None
    location_name: str
    latitude: float
    longitude: float
    geo_point: Optional[str] = None
    assigned_department: Optional[str] = None
    assigned_officer: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComplaintDetailResponse(ComplaintResponse):
    category: CategoryResponse
    municipality: Optional[MunicipalityResponse] = None
    attachments: List[AttachmentResponse] = []
    timeline: List[StatusHistoryResponse] = []
    resolution: Optional[ResolutionResponse] = None

    class Config:
        from_attributes = True
