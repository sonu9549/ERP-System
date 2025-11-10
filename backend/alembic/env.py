# alembic/env.py
import os
import sys
from pathlib import Path
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy import engine_from_config
from alembic import context

# ------------------------------------------------------------------
# 1. Add project root to PYTHONPATH
# ------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# ------------------------------------------------------------------
# 2. Import SQLModel + ALL models
# ------------------------------------------------------------------
from sqlmodel import SQLModel                     # <-- Core
from app.models.user import User                  # <-- Your table
# from app.models.role import Role
# from app.models.product import Product
# ... import ALL SQLModel tables here ...

# ------------------------------------------------------------------
# 3. Import settings (DATABASE_URL_SYNC for Alembic)
# ------------------------------------------------------------------
from app.core.config import get_settings
settings = get_settings()

# ------------------------------------------------------------------
# 4. Alembic config
# ------------------------------------------------------------------
config = context.config

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ------------------------------------------------------------------
# 5. Override sqlalchemy.url with SYNC URL (psycopg)
# ------------------------------------------------------------------
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# ------------------------------------------------------------------
# 6. target_metadata – all tables
# ------------------------------------------------------------------
target_metadata = SQLModel.metadata

# ------------------------------------------------------------------
# 7. Offline mode
# ------------------------------------------------------------------
def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL_SYNC,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ------------------------------------------------------------------
# 8. Online mode (sync connection)
# ------------------------------------------------------------------
def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
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


# ------------------------------------------------------------------
# 9. Run
# ------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()