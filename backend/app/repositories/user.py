import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class UserRepository:
    def get_by_id(self, db: Session, id: uuid.UUID) -> Optional[User]:
        """
        Fetch a user profile by their primary key. Excludes soft-deleted users.
        """
        return db.query(User).filter(User.id == id, User.is_deleted == False).first()

    def get_by_firebase_uid(self, db: Session, firebase_uid: str) -> Optional[User]:
        """
        Fetch a user profile by their Firebase UID string. Excludes soft-deleted users.
        """
        return db.query(User).filter(User.firebase_uid == firebase_uid, User.is_deleted == False).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Fetch a user profile by their unique email. Excludes soft-deleted users.
        """
        return db.query(User).filter(User.email == email, User.is_deleted == False).first()

    def create(self, db: Session, user_in: UserCreate) -> User:
        """
        Add and commit a new User profile to the database.
        """
        db_obj = User(
            firebase_uid=user_in.firebase_uid,
            email=user_in.email,
            name=user_in.name,
            profile_picture=user_in.profile_picture,
            role=user_in.role.value if hasattr(user_in.role, "value") else user_in.role,
            is_active=user_in.is_active
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: User, obj_in: UserUpdate) -> User:
        """
        Update fields on an existing user database record.
        """
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

user_repository = UserRepository()
