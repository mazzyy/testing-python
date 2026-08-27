"""
Configuration settings for the DAAD Course Recommendation System
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
from pydantic import validator



class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "DAAD Course Recommendation System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Database
    DATABASE_URL: str = "sqlite:///./daad_app.db"
    
    # JWT Authentication
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Azure OpenAI (Chat/Completions)
    AZURE_OPENAI_ENDPOINT: str = "https://veilixdocumentextraction.openai.azure.com/"
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-5-mini"
    AZURE_OPENAI_API_VERSION: str = "2024-02-15-preview"
    
    # Azure OpenAI (Embeddings) - separate resource to save memory
    AZURE_EMBEDDING_ENDPOINT: str = "https://embeding.openai.azure.com/"
    AZURE_EMBEDDING_API_KEY: str = ""
    AZURE_EMBEDDING_DEPLOYMENT: str = "text-embedding-3-small"
    AZURE_EMBEDDING_API_VERSION: str = "2024-02-15-preview"
    
    # ChromaDB
    CHROMA_DB_PATH: str = "./chroma_db"
    
    # CORS
    # CORS_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    CORS_ORIGINS: list = ["*"]
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = [".pdf", ".docx", ".doc"]
    
    # Email Settings (SMTP)
    SMTP_HOST: str = ""  # e.g., "smtp.gmail.com" or leave empty to disable
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@uniadvisor.com"
    SMTP_FROM_NAME: str = "UniAdvisor"
    SMTP_USE_TLS: bool = True
    
    @validator("DATABASE_URL", pre=True)
    def fix_heroku_postgres_url(cls, v: str) -> str:
        """
        Heroku sometimes feeds 'postgres://' but modern SQLAlchemy requires 'postgresql://'.
        This intercepts the value and corrects the dialect.
        """
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
