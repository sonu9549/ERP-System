import os
import sys
from pathlib import Path

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool  # <-- MUST BE HERE
from alembic import context

# Import your app
from app.core.config import get_settings
from app.db.session import SQLModel
from app.models import *  # Import all models

# Load settings
settings = get_settings()
target_metadata = SQLModel.metadata

# === CONFIG ===
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# === MIGRATIONS ===
def run_migrations_offline():
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        {"sqlalchemy.url": settings.DATABASE_URL},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()