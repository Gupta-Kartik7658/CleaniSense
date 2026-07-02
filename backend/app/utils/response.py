from typing import Any, Optional
from pydantic import BaseModel

class StandardResponseModel(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

def standard_response(success: bool, message: str, data: Any = None) -> dict:
    """
    Format standard API JSON response.
    """
    return {
        "success": success,
        "message": message,
        "data": data
    }
