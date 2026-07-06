import logging
from firebase_admin import auth
from sqlalchemy.orm import Session
from app.core.firebase import initialize_firebase
from app.services.user_service import user_service
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User

logger = logging.getLogger("uvicorn")

class AuthService:
    def verify_firebase_token(self, id_token: str) -> dict:
        """
        Verify the Firebase ID token using the Firebase Admin SDK.
        Returns the decoded token dictionary.
        """
        # Ensure Firebase is initialized
        initialize_firebase()
        
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            logger.error(f"Firebase token verification failed: {e}")
            raise ValueError("Invalid or expired Firebase ID token")

    def authenticate_user(self, db: Session, decoded_token: dict) -> User:
        """
        Find or create a user in the database based on the verified Firebase token claims.
        """
        firebase_uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        name = decoded_token.get("name")
        picture = decoded_token.get("picture")

        if not firebase_uid or not email:
            raise ValueError("Firebase token is missing required claims (uid, email)")

        # Search by firebase_uid first, then by email to handle existing accounts
        user = user_service.get_user_by_firebase_uid(db, firebase_uid)
        if not user:
            user = user_service.get_user_by_email(db, email)

        if user:
            # Update mutable fields on existing user (idempotent)
            update_data = UserUpdate(
                firebase_uid=firebase_uid,
                name=name,
                profile_picture=picture,
            )
            user = user_service.update_user(db, user, update_data)
            logger.info(f"Updated existing user: {email}")
        else:
            # First time logging in: register the user as a citizen
            user_in = UserCreate(
                firebase_uid=firebase_uid,
                email=email,
                name=name,
                profile_picture=picture,
                role="citizen",
                is_active=True
            )
            user = user_service.create_user(db, user_in)
            logger.info(f"Registered new citizen user: {email} with UID: {firebase_uid}")

        if not user.is_active:
            raise PermissionError("User account has been deactivated")

        return user

auth_service = AuthService()
