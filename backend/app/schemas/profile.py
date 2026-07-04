import uuid
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

SUPPORTED_LANGUAGES: List[str] = ["en", "hi", "gu", "bn", "ta", "te"]
SUPPORTED_THEMES: List[str] = ["light", "dark", "system"]

class UserPreferenceBase(BaseModel):
    language: str = "en"
    theme: str = "system"
    notifications_enabled: bool = True

class UserPreferenceUpdate(BaseModel):
    language: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Language must be one of: {SUPPORTED_LANGUAGES}")
        return v

    @field_validator("theme")
    @classmethod
    def validate_theme(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in SUPPORTED_THEMES:
            raise ValueError(f"Theme must be one of: {SUPPORTED_THEMES}")
        return v

class UserPreferenceResponse(UserPreferenceBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    profile_picture: Optional[str] = Field(None, max_length=1024)

class ProfileResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    role: str
    is_active: bool
    preferences: Optional[UserPreferenceResponse] = None

    class Config:
        from_attributes = True
