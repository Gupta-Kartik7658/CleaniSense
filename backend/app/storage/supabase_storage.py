import os
import uuid
from typing import Tuple
from supabase import create_client, Client
from app.core.config import settings


def _infer_content_type(ext: str) -> str:
    mapping = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
    }
    return mapping.get(ext.lower(), "application/octet-stream")


class SupabaseStorage:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        self.bucket_name = settings.SUPABASE_BUCKET
        self.bucket = self.client.storage.from_(self.bucket_name)

    def upload_file(
        self,
        file_content: bytes,
        filename: str,
        folder: str = "complaints",
    ) -> Tuple[str, str, str]:
        """
        Uploads file to Supabase Storage bucket.
        Returns tuple of (storage_provider, storage_path, '').
        The public URL is never stored; it is generated dynamically
        via get_public_url() with a short-lived signed token.
        """
        ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        storage_path = f"{folder}/{unique_filename}"

        content_type = _infer_content_type(ext)

        self.bucket.upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": content_type},
        )

        return "supabase", storage_path, ""

    def get_public_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """
        Generates a short-lived signed URL for private file access.
        Default expiry is 1 hour (3600s) as recommended for security.
        """
        response = self.bucket.create_signed_url(
            path=storage_path,
            expires_in=expires_in,
        )
        return response["signedURL"]

    def delete_file(self, storage_path: str) -> bool:
        """
        Removes file from Supabase Storage bucket.
        """
        try:
            self.bucket.remove([storage_path])
            return True
        except Exception:
            return False
