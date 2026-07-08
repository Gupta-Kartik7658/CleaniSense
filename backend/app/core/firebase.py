import os
import logging
import firebase_admin
from firebase_admin import credentials
from app.core.config import settings

logger = logging.getLogger("uvicorn")

def initialize_firebase():
    if not firebase_admin._apps:
        cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
        
        # If it's a relative path, resolve it relative to the root backend workspace directory
        if not os.path.isabs(cred_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            cred_path = os.path.join(base_dir, cred_path)
            
        if os.path.exists(cred_path):
            try:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info(f"Firebase Admin SDK successfully initialized with service account from {cred_path}")
            except Exception as e:
                logger.error(f"Error initializing Firebase Admin with service account: {e}")
                raise e
        else:
            # Credentials missing — surface a clear startup error instead of
            # silently booting a fake identity. Auth is mandatory for this app.
            logger.error(
                f"Firebase credentials not found at {cred_path}. "
                f"Set GOOGLE_APPLICATION_CREDENTIALS or place a service account JSON there."
            )
            raise FileNotFoundError(
                f"Firebase service account credentials missing at {cred_path}. "
                f"Cannot start without a valid Firebase identity."
            )

# Initialize immediately on module import
initialize_firebase()
