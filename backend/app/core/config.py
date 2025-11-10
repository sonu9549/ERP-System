# app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Literal

class Settings(BaseSettings):
    # ──────────────────────────────────────────────────────────────
    # App
    # ──────────────────────────────────────────────────────────────
    PROJECT_NAME: str = "NextGen LEDGER API"
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str  # REQUIRED – no default
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ──────────────────────────────────────────────────────────────
    # PostgreSQL
    # ──────────────────────────────────────────────────────────────
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # Optional: Use async driver
    DATABASE_DRIVER: Literal["psycopg"] 

    # ──────────────────────────────────────────────────────────────
    # Computed SQLAlchemy URL (SQLModel uses this name)
    # ──────────────────────────────────────────────────────────────
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+{self.DATABASE_DRIVER}://"
            f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    class Config:
        env_file = ".env"
        case_sensitive = False

def get_settings() -> Settings:
    return Settings()


settings = get_settings()

