"""
DocuGraph AI – Configuration (pydantic-settings)
Reads from .env file automatically.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "change-me"

    # Gemini
    GEMINI_API_KEY: str = "mock-gemini-key"
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "text-embedding-004"

    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "password"

    # Database (PostgreSQL or local SQLite for development)
    POSTGRES_URL: str = "sqlite+aiosqlite:///./docugraph.db"

    # Supabase
    SUPABASE_URL: str = "https://wfibadajisvzpyezkraw.supabase.co"
    SUPABASE_ANON_KEY: str = "sb_publishable_vAtN1SySYpLS7R4xkXgK8Q_4dNqiPvm"
    SUPABASE_SERVICE_ROLE_KEY: str = "mock-service-role-key"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    

    # Storage
    SUPABASE_STORAGE_BUCKET: str = "docugraph-files"
    MAX_FILE_SIZE_MB: int = 50
    MAX_PAGES: int = 500
    FILE_AUTO_DELETE_HOURS: int = 24

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

