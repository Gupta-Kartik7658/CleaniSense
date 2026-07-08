from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    idToken: str
    role: Optional[str] = None

