# app/db/session.py
from sqlmodel import create_engine, Session
from app.core.config import settings

# Create engine using SQLModel's create_engine
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    echo=False,           # Set True for SQL debugging
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

def get_session():
    """Dependency to get a SQLModel Session."""
    with Session(engine) as session:
        yield session