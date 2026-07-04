from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.user import user_repository
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class UserService:
    def get_user_by_firebase_uid(self, db: Session, firebase_uid: str) -> Optional[User]:
        """
        Retrieve a user profile using their Firebase UID.
        """
        return user_repository.get_by_firebase_uid(db, firebase_uid)

    def create_user(self, db: Session, user_in: UserCreate) -> User:
        """
        Create a new user profile.
        """
        return user_repository.create(db, user_in)

    def update_user(self, db: Session, db_obj: User, obj_in: UserUpdate) -> User:
        """
        Update fields on an existing user database record.
        """
        return user_repository.update(db, db_obj, obj_in)

user_service = UserService()
