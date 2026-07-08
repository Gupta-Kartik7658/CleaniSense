from app.core.config import settings

def get_storage_client():
    """
    Factory function to retrieve configured storage client backend.
    """
    if settings.STORAGE_BACKEND == "supabase":
        from app.storage.supabase_storage import SupabaseStorage
        return SupabaseStorage()
    elif settings.STORAGE_BACKEND == "firebase":
        from app.storage.firebase_storage import FirebaseStorage
        return FirebaseStorage()
    elif settings.STORAGE_BACKEND == "local":
        from app.storage.local_storage import LocalStorage
        return LocalStorage()
    raise RuntimeError(f"Unsupported STORAGE_BACKEND: {settings.STORAGE_BACKEND}")
