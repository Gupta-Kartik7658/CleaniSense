import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    role: str = "citizen"
    is_active: bool = True

class UserCreate(UserBase):
    firebase_uid: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: uuid.UUID
    firebase_uid: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
