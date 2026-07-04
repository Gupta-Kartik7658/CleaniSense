import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.notification import Notification
from app.repositories.notification import notification_repository

class NotificationService:
    def create_notification(
        self,
        db: Session,
        user_id: uuid.UUID,
        complaint_id: Optional[uuid.UUID],
        title: str,
        message: str,
        notification_type: str
    ) -> Notification:
        """
        Delegates notification creation to the repository layer.
        """
        return notification_repository.create(
            db=db,
            user_id=user_id,
            complaint_id=complaint_id,
            title=title,
            message=message,
            notification_type=notification_type
        )

    def list_notifications(
        self,
        db: Session,
        user_id: uuid.UUID,
        is_read: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20
    ) -> dict:
        """
        Fetch paginated list of notifications for user.
        """
        return notification_repository.list_for_user(
            db=db,
            user_id=user_id,
            is_read=is_read,
            page=page,
            limit=page_size
        )

    def count_unread(self, db: Session, user_id: uuid.UUID) -> int:
        """
        Get the count of unread notifications for a user.
        """
        return notification_repository.count_unread(db=db, user_id=user_id)

    def mark_as_read(self, db: Session, id: uuid.UUID, user_id: uuid.UUID) -> Notification:
        """
        Mark a specific notification as read.
        """
        notification = notification_repository.get(db=db, id=id, user_id=user_id)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
            
        notification.is_read = True
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    def mark_all_as_read(self, db: Session, user_id: uuid.UUID) -> int:
        """
        Mark all notifications for the user as read.
        """
        return notification_repository.mark_all_as_read(db=db, user_id=user_id)

notification_service = NotificationService()
