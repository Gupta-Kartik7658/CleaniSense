from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_ignore_empty=True, 
        extra="ignore"
    )
    
    PROJECT_NAME: str = "CleaniSense"
    API_V1_STR: str = "/api/v1"

    # CORS — comma-separated list of allowed origins (env-driven).
    # Dev default permits the Next.js dev server; tighten via .env for prod.
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Database
    DATABASE_URL: str = "sqlite:///./cleanisense.db"
    
    # Firebase
    GOOGLE_APPLICATION_CREDENTIALS: str = "firebase-service-account.json"

    # Gemini Vision
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    GEMINI_TIMEOUT_SECONDS: float = 4.0
    GEMINI_ENABLED: bool = True
    
    # Storage
    STORAGE_BACKEND: str = "local"
    FIREBASE_STORAGE_BUCKET: str = ""
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # Supabase Storage
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_BUCKET: str = "complaints"
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Mock mode
    MOCK_MODE: bool = False
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # App metadata
    APP_VERSION: str = "1.0.0"

settings = Settings()
