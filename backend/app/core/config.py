from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "NexGen ERP"
    DATABASE_URL: str ="postgresql+psycopg2://postgres:root@localhost:5432/erp_system"
    SECRET_KEY: str = "replace-this-with-a-strong-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"

settings = Settings()
