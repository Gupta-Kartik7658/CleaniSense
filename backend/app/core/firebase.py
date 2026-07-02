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
            logger.warning(f"Firebase credentials not found at {cred_path}. Falling back to standard initialization.")
            try:
                firebase_admin.initialize_app()
            except Exception as e:
                logger.error(f"Failed default Firebase initialization: {e}")
                # Fallback to inline mock structure in dev environment to avoid crash
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": "cleanisense-mock",
                    "private_key_id": "mockkeyid",
                    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6N4S8MOCKMOCK\n-----END PRIVATE KEY-----\n",
                    "client_email": "firebase-adminsdk-mock@cleanisense-mock.iam.gserviceaccount.com"
                })
                firebase_admin.initialize_app(cred)
                logger.warning("Firebase Admin initialized using fallback mock credentials.")

# Initialize immediately on module import
initialize_firebase()
