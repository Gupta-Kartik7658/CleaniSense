from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate

class UserRepository:
    def get_by_firebase_uid(self, db: Session, firebase_uid: str) -> Optional[User]:
        """
        Fetch a user profile by their Firebase UID string.
        """
        return db.query(User).filter(User.firebase_uid == firebase_uid).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Fetch a user profile by their unique email.
        """
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, user_in: UserCreate) -> User:
        """
        Add and commit a new User profile to the database.
        """
        db_obj = User(
            firebase_uid=user_in.firebase_uid,
            email=user_in.email,
            name=user_in.name,
            profile_picture=user_in.profile_picture,
            role=user_in.role,
            is_active=user_in.is_active
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

user_repository = UserRepository()
