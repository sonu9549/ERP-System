"""merge role enum and is_superadmin

Revision ID: f4a2baaced8b
Revises: 5fd238b97d05, 859937cf95ad
Create Date: 2025-11-09 20:30:36.852266

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a2baaced8b'
down_revision: Union[str, None] = ('5fd238b97d05', '859937cf95ad')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
