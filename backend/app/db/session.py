# app/db/session.py
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import Base  # SQLModel Base
from typing import AsyncGenerator

# ------------------------------------------------------------------
# Engine
# ------------------------------------------------------------------
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
)

# ------------------------------------------------------------------
# Session factory
# ------------------------------------------------------------------
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ------------------------------------------------------------------
# Async context manager (used internally)
# ------------------------------------------------------------------
@asynccontextmanager
async def _get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

# ------------------------------------------------------------------
# Dependency: yields AsyncSession (use in Depends)
# ------------------------------------------------------------------


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# ------------------------------------------------------------------
# DB init / drop
# ------------------------------------------------------------------
async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def drop_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)