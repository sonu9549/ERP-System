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

    # ──────────────────────────────────────────────────────────────
    # JWT
    # ──────────────────────────────────────────────────────────────
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
    DATABASE_DRIVER: Literal["asyncpg", "psycopg"] = "asyncpg"

    # ──────────────────────────────────────────────────────────────
    # Computed SQLAlchemy URL (SQLModel uses this name)
    # ──────────────────────────────────────────────────────────────
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        driver = "postgresql+asyncpg" if self.DATABASE_DRIVER == "asyncpg" else "postgresql+psycopg"
        return (
            f"{driver}://"
            f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}"
            f"/{self.POSTGRES_DB}"
        )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False  # allows POSTGRES_USER or postgres_user


# ──────────────────────────────────────────────────────────────
# Cached singleton
# ──────────────────────────────────────────────────────────────
@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Global instance (import this everywhere)
settings = get_settings()