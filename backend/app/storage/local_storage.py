import os
import uuid
from typing import Tuple
from app.core.config import settings

class LocalStorage:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload_file(self, file_content: bytes, filename: str, folder: str = "complaints") -> Tuple[str, str, str]:
        """
        Saves file to local uploads directory.
        Returns tuple of (storage_provider, storage_path, public_url).
        """
        ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        # Save path relative to upload_dir
        relative_path = os.path.join(folder, unique_filename).replace("\\", "/")
        full_dest_path = os.path.join(self.upload_dir, folder, unique_filename)
        
        # Ensure target folder inside uploads exists
        os.makedirs(os.path.dirname(full_dest_path), exist_ok=True)
        
        # Write bytes
        with open(full_dest_path, "wb") as f:
            f.write(file_content)
            
        # For local storage, the public url is configured as a static file route: /uploads/...
        public_url = f"/uploads/{relative_path}"
        
        return "local", relative_path, public_url

    def delete_file(self, storage_path: str) -> bool:
        """
        Removes file from local uploads directory.
        """
        full_path = os.path.join(self.upload_dir, storage_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False
