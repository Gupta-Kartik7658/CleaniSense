import firebase_admin
from firebase_admin import storage
import uuid
import os
import urllib.parse
from typing import Tuple
from app.core.config import settings

class FirebaseStorage:
    def __init__(self):
        self.bucket_name = settings.FIREBASE_STORAGE_BUCKET

    def upload_file(self, file_content: bytes, filename: str, folder: str = "complaints") -> Tuple[str, str, str]:
        """
        Uploads file to Firebase Storage bucket.
        Returns tuple of (storage_provider, storage_path, public_url).
        """
        ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        storage_path = f"{folder}/{unique_filename}"

        # Get bucket instance (uses default if name not provided)
        bucket = storage.bucket(name=self.bucket_name if self.bucket_name else None)
        blob = bucket.blob(storage_path)
        
        # Upload content from string/bytes
        blob.upload_from_string(file_content)
        
        # Construct public download URL
        encoded_path = urllib.parse.quote(storage_path, safe='')
        public_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{encoded_path}?alt=media"

        return "firebase", storage_path, public_url

    def delete_file(self, storage_path: str) -> bool:
        """
        Deletes file from Firebase Storage bucket.
        """
        bucket = storage.bucket(name=self.bucket_name if self.bucket_name else None)
        blob = bucket.blob(storage_path)
        if blob.exists():
            blob.delete()
            return True
        return False
