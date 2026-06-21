import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@host/neondb?sslmode=require"
    SECRET_KEY: str = "dev_secret_key_987654321_ai_research_assistant"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    LLM_PROVIDER: str = "gemini"  # "gemini" or "openai"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Storage locations
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "uploaded_papers")
    DOCS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "generated_docs")
    TEMP_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "temp")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Create directories if they don't exist
for path in [settings.UPLOAD_DIR, settings.DOCS_DIR, settings.TEMP_DIR]:
    os.makedirs(path, exist_ok=True)
