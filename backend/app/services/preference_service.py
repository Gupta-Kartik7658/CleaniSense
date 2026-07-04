import uuid
from sqlalchemy.orm import Session
from app.repositories.preference import preference_repository
from app.models.user_preference import UserPreference
from app.schemas.profile import UserPreferenceUpdate

class PreferenceService:
    def get_or_create_preferences(self, db: Session, user_id: uuid.UUID) -> UserPreference:
        """
        Get existing preferences for a user, or create defaults if they don't exist.
        """
        preferences = preference_repository.get_by_user_id(db, user_id)
        if not preferences:
            preferences = preference_repository.create_default(db, user_id)
        return preferences

    def update_preferences(
        self, db: Session, user_id: uuid.UUID, preference_in: UserPreferenceUpdate
    ) -> UserPreference:
        """
        Update preferences for a user.
        """
        preferences = self.get_or_create_preferences(db, user_id)
        update_data = preference_in.model_dump(exclude_unset=True)
        return preference_repository.update(db, preferences, update_data)

preference_service = PreferenceService()
