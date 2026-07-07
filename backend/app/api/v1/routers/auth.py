from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.schemas.auth import LoginRequest
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service
from app.utils.response import standard_response, StandardResponseModel
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=StandardResponseModel)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Accepts client Firebase ID token, verifies it, finds/registers user, and returns profile.
    """
    try:
        decoded_token = auth_service.verify_firebase_token(request.idToken)
        user = auth_service.authenticate_user(db, decoded_token, role=request.role)
        user_data = UserResponse.model_validate(user)
        return standard_response(
            success=True,
            message="Successfully authenticated",
            data=user_data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication server error: {e}"
        )

@router.get("/me", response_model=StandardResponseModel)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns user details for verified requests.
    """
    user_data = UserResponse.model_validate(current_user)
    return standard_response(
        success=True,
        message="Fetched active user session details",
        data=user_data
    )

@router.post("/logout", response_model=StandardResponseModel)
def logout():
    """
    Exposes logout endpoint helper.
    """
    return standard_response(
        success=True,
        message="Logged out successfully"
    )
