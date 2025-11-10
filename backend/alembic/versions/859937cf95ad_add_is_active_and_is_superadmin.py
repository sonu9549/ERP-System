# alembic/versions/859937cf95ad_add_is_active_and_is_superadmin.py

"""add is_active and is_superadmin to user table"""

from alembic import op
import sqlalchemy as sa

revision = '859937cf95ad'
down_revision = None


def upgrade() -> None:
    # ADD COLUMNS WITH DEFAULT VALUES
    op.add_column(
        'user',
        sa.Column(
            'is_active',
            sa.Boolean(),
            server_default=sa.text('true'),   # Existing rows ko TRUE milega
            nullable=False
        )
    )
    op.add_column(
        'user',
        sa.Column(
            'is_superadmin',
            sa.Boolean(),
            server_default=sa.text('false'),  # Existing rows ko FALSE milega
            nullable=False
        )
    )

    # Admin ko superadmin banao
    op.execute("UPDATE \"user\" SET is_superadmin = true WHERE email = 'admin@nextgen.com'")


def downgrade() -> None:
    op.drop_column('user', 'is_superadmin')
    op.drop_column('user', 'is_active')