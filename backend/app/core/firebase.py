import os
import json
import logging
import firebase_admin
from firebase_admin import credentials
from app.core.config import settings

logger = logging.getLogger("uvicorn")

def initialize_firebase():
    if not firebase_admin._apps:
        if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
            try:
                service_account = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
                cred = credentials.Certificate(service_account)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_JSON")
                return
            except Exception as e:
                logger.error("Error initializing Firebase from FIREBASE_SERVICE_ACCOUNT_JSON: %s", e)
                raise e

        cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS.strip()
        if not cred_path:
            raise FileNotFoundError(
                "Firebase credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_JSON "
                "for hosted deployments, or GOOGLE_APPLICATION_CREDENTIALS for local development."
            )
        
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
