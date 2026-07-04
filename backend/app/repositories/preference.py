from typing import Optional
import uuid
from sqlalchemy.orm import Session
from app.models.user_preference import UserPreference

class PreferenceRepository:
    def get_by_user_id(self, db: Session, user_id: uuid.UUID) -> Optional[UserPreference]:
        """
        Fetch user preferences by user_id.
        """
        return db.query(UserPreference).filter(UserPreference.user_id == user_id).first()

    def create_default(self, db: Session, user_id: uuid.UUID) -> UserPreference:
        """
        Create default user preferences.
        """
        db_obj = UserPreference(
            user_id=user_id,
            language="en",
            theme="system",
            notifications_enabled=True
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: UserPreference, update_data) -> UserPreference:
        """
        Update user preferences.
        """
        if hasattr(update_data, "model_dump"):
            data_dict = update_data.model_dump(exclude_unset=True)
        elif hasattr(update_data, "dict"):
            data_dict = update_data.dict(exclude_unset=True)
        else:
            data_dict = update_data

        for field, value in data_dict.items():
            if hasattr(db_obj, field) and value is not None:
                setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

preference_repository = PreferenceRepository()
