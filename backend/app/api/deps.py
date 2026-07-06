import logging
from typing import Generator
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.services.auth_service import auth_service
from app.services.user_service import user_service
from app.models.user import User

logger = logging.getLogger("uvicorn")

security = HTTPBearer()

def get_db() -> Generator[Session, None, None]:
    """
    Dependency to yield database sessions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Extracts Bearer token, verifies Firebase ID claim via Firebase Admin SDK, and fetches user.
    """
    token = credentials.credentials
    # Log truncated token for correlation (first 10 chars only for security)
    token_prefix = token[:10] if token else "empty"
    logger.debug(f"[Auth] Verifying token prefix={token_prefix}... for {request.method} {request.url.path}")

    try:
        decoded_token = auth_service.verify_firebase_token(token)
        firebase_uid = decoded_token.get("uid")
        if not firebase_uid:
            logger.warning(f"[Auth] Token missing UID claim — token_prefix={token_prefix}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase ID token is missing the UID claim",
            )
            
        user = user_service.get_user_by_firebase_uid(db, firebase_uid)
        if not user:
            logger.warning(f"[Auth] User not found for firebase_uid={firebase_uid}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not registered in the system",
            )
            
        if not user.is_active:
            logger.warning(f"[Auth] Deactivated user attempted access — user={user.id} email={user.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated",
            )
            
        # Store in request state for logging middleware access
        request.state.user_id = str(user.id)
        logger.debug(f"[Auth] Authenticated user={user.id} role={user.role}")
        return user
    except ValueError as e:
        logger.warning(f"[Auth] Token verification failed — {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PermissionError as e:
        logger.warning(f"[Auth] Permission error — {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )

class RoleChecker:
    def __init__(self, allowed_role: str):
        self.allowed_role = allowed_role

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != self.allowed_role:
            logger.warning(
                f"[Auth] Role check failed — user={current_user.id} "
                f"role={current_user.role} required={self.allowed_role}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation restricted to users with the '{self.allowed_role}' role.",
            )
        return current_user

require_admin = RoleChecker("admin")
require_citizen = RoleChecker("citizen")
