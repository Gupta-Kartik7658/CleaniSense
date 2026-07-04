import uuid
from typing import Optional
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.utils.pagination import paginate

class NotificationRepository:
    def create(
        self,
        db: Session,
        user_id: uuid.UUID,
        complaint_id: Optional[uuid.UUID],
        title: str,
        message: str,
        notification_type: str
    ) -> Notification:
        """
        Creates and persists a new notification.
        """
        db_obj = Notification(
            user_id=user_id,
            complaint_id=complaint_id,
            title=title,
            message=message,
            type=notification_type,
            is_read=False
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get(self, db: Session, id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        """
        Retrieve a specific notification belonging to the user.
        """
        return db.query(Notification).filter(
            Notification.id == id,
            Notification.user_id == user_id
        ).first()

    def list_for_user(
        self,
        db: Session,
        user_id: uuid.UUID,
        is_read: Optional[bool] = None,
        page: int = 1,
        limit: int = 20
    ) -> dict:
        """
        Fetch paginated notifications list.
        """
        query = db.query(Notification).filter(Notification.user_id == user_id)
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)
        query = query.order_by(desc(Notification.created_at))
        return paginate(query, page, limit)

    def count_unread(self, db: Session, user_id: uuid.UUID) -> int:
        """
        Count unread notifications.
        """
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

    def mark_all_as_read(self, db: Session, user_id: uuid.UUID) -> int:
        """
        Mark all user notifications as read.
        """
        unread_notifications = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).all()
        count = 0
        for item in unread_notifications:
            item.is_read = True
            db.add(item)
            count += 1
        db.commit()
        return count

notification_repository = NotificationRepository()
