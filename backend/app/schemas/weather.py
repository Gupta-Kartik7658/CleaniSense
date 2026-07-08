import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WeatherObservationResponse(BaseModel):
    id: uuid.UUID
    complaint_id: Optional[uuid.UUID] = None
    latitude: float
    longitude: float
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    rain_probability_percent: Optional[float] = None
    precipitation_mm: Optional[float] = None
    aqi_us: Optional[float] = None
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    source: str
    observed_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WeatherCoordinateQuery(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
