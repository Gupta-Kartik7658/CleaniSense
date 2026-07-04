from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.profile import (
    ProfileUpdate,
    ProfileResponse,
    UserPreferenceUpdate,
    UserPreferenceResponse
)
from app.services.user_service import user_service
from app.services.preference_service import preference_service
from app.utils.response import standard_response, StandardResponseModel
from app.schemas.user import UserUpdate

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("", response_model=StandardResponseModel, summary="Get User Profile", description="Retrieves active user profile details along with current preference values.")
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user profile including preferences.
    """
    # Ensure preferences are loaded/created
    prefs = preference_service.get_or_create_preferences(db, current_user.id)
    profile_data = ProfileResponse.model_validate(current_user)
    return standard_response(
        success=True,
        message="Profile retrieved successfully",
        data=profile_data
    )

@router.put("", response_model=StandardResponseModel, summary="Update User Profile", description="Updates user account information such as full name and profile picture URL.")
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update basic profile information.
    """
    user_update = UserUpdate(
        name=profile_in.name,
        profile_picture=profile_in.profile_picture
    )
    updated_user = user_service.update_user(db, current_user, user_update)
    # Ensure preferences are loaded/created in the session for validation
    preference_service.get_or_create_preferences(db, updated_user.id)
    profile_data = ProfileResponse.model_validate(updated_user)
    return standard_response(
        success=True,
        message="Profile updated successfully",
        data=profile_data
    )

@router.get("/preferences", response_model=StandardResponseModel, summary="Get User Preferences", description="Retrieves user preferences (language, theme, and notification configs).")
def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user preferences.
    """
    prefs = preference_service.get_or_create_preferences(db, current_user.id)
    prefs_data = UserPreferenceResponse.model_validate(prefs)
    return standard_response(
        success=True,
        message="Preferences retrieved successfully",
        data=prefs_data
    )

@router.put("/preferences", response_model=StandardResponseModel, summary="Update User Preferences", description="Updates specific user settings for localized language, theme preference, and notifications toggles.")
def update_preferences(
    preference_in: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user preferences.
    """
    updated_prefs = preference_service.update_preferences(db, current_user.id, preference_in)
    prefs_data = UserPreferenceResponse.model_validate(updated_prefs)
    return standard_response(
        success=True,
        message="Preferences updated successfully",
        data=prefs_data
    )
