from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_ignore_empty=True, 
        extra="ignore"
    )
    
    PROJECT_NAME: str = "CleaniSense"
    API_V1_STR: str = "/api/v1"
    
    # Security / JWT
    SECRET_KEY: str = "change_this_to_a_very_secure_secret_key_for_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./cleanisense.db"
    
    # External APIs
    GEMINI_API_KEY: str = ""
    OPENAQ_API_KEY: str = ""
    OPEN_METEO_URL: str = "https://api.open-meteo.com/v1"

settings = Settings()
