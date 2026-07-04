from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services.notification_service import notification_service
from app.utils.response import standard_response, StandardResponseModel

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=StandardResponseModel, summary="List Notifications", description="Retrieves a paginated list of system and complaint status update notifications for the user.")
def list_notifications(
    is_read: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get paginated user notifications, optionally filtered by read status.
    """
    paginated_data = notification_service.list_notifications(
        db=db,
        user_id=current_user.id,
        is_read=is_read,
        page=page,
        page_size=page_size
    )
    paginated_data["items"] = [NotificationResponse.model_validate(item) for item in paginated_data["items"]]
    return standard_response(
        success=True,
        message="Notifications retrieved successfully",
        data=paginated_data
    )

@router.get("/unread-count", response_model=StandardResponseModel, summary="Get Unread Count", description="Returns the count of unread notifications for the authenticated user.")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the unread notification count.
    """
    count = notification_service.count_unread(db, current_user.id)
    return standard_response(
        success=True,
        message="Unread notification count retrieved successfully",
        data={"count": count}
    )

@router.put("/read-all", response_model=StandardResponseModel, summary="Mark All as Read", description="Marks all unread notifications belonging to the user as read.")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all user notifications as read.
    """
    count = notification_service.mark_all_as_read(db, current_user.id)
    return standard_response(
        success=True,
        message=f"Marked {count} notifications as read",
        data={"count_marked": count}
    )

@router.put("/{id}/read", response_model=StandardResponseModel, summary="Mark Notification as Read", description="Marks a specific notification as read by its unique ID.")
def mark_single_read(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a single notification as read.
    """
    notification = notification_service.mark_as_read(db, id, current_user.id)
    notification_data = NotificationResponse.model_validate(notification)
    return standard_response(
        success=True,
        message="Notification marked as read successfully",
        data=notification_data
    )
