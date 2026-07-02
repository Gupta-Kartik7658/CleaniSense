from pydantic import BaseModel

class LoginRequest(BaseModel):
    idToken: str
