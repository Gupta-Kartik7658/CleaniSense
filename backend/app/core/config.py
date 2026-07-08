from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_ignore_empty=True, 
        extra="ignore"
    )
    
    PROJECT_NAME: str = "CleaniSense"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production"

    # CORS — comma-separated list of allowed origins (env-driven).
    BACKEND_CORS_ORIGINS: str = ""

    # Database
    DATABASE_URL: str = ""
    
    # Firebase
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    FIREBASE_SERVICE_ACCOUNT_JSON: str = ""

    # Gemini Vision
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    GEMINI_TIMEOUT_SECONDS: float = 4.0
    GEMINI_ENABLED: bool = True

    # Weather / Air Quality
    WEATHER_PROVIDER: str = "open-meteo"
    OPEN_METEO_FORECAST_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_AIR_QUALITY_URL: str = "https://air-quality-api.open-meteo.com/v1/air-quality"
    WEATHER_TIMEOUT_SECONDS: float = 4.0

    # Hotspot Detection
    HOTSPOT_RADIUS_METERS: float = 500.0
    HOTSPOT_MIN_COMPLAINTS: int = 2
    
    # Storage
    STORAGE_BACKEND: str = "supabase"
    FIREBASE_STORAGE_BUCKET: str = ""
    UPLOAD_DIR: str = ""
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

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in {"production", "prod"}

    @model_validator(mode="after")
    def validate_deployment_config(self):
        self.ENVIRONMENT = self.ENVIRONMENT.strip().lower()
        self.STORAGE_BACKEND = self.STORAGE_BACKEND.strip().lower()

        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set")

        if self.is_production:
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError("Production DATABASE_URL must use an external database, not SQLite")
            if self.STORAGE_BACKEND == "local":
                raise ValueError("Production STORAGE_BACKEND must be supabase or firebase, not local")
            if not (self.FIREBASE_SERVICE_ACCOUNT_JSON or self.GOOGLE_APPLICATION_CREDENTIALS):
                raise ValueError("Firebase credentials must be set with FIREBASE_SERVICE_ACCOUNT_JSON")

        if self.STORAGE_BACKEND == "supabase":
            missing = [
                name
                for name, value in {
                    "SUPABASE_URL": self.SUPABASE_URL,
                    "SUPABASE_SERVICE_ROLE_KEY": self.SUPABASE_SERVICE_ROLE_KEY,
                    "SUPABASE_BUCKET": self.SUPABASE_BUCKET,
                }.items()
                if not value
            ]
            if missing:
                raise ValueError(f"Supabase storage is missing: {', '.join(missing)}")
        elif self.STORAGE_BACKEND == "firebase":
            if not self.FIREBASE_STORAGE_BUCKET:
                raise ValueError("Firebase storage requires FIREBASE_STORAGE_BUCKET")
        elif self.STORAGE_BACKEND == "local" and self.is_production:
            raise ValueError("Local storage is not allowed in production")
        elif self.STORAGE_BACKEND not in {"supabase", "firebase", "local"}:
            raise ValueError("STORAGE_BACKEND must be supabase, firebase, or local")

        return self

settings = Settings()
