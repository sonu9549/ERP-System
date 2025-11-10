"""add role enum and migrate existing integer values"""

from alembic import op
import sqlalchemy as sa
from app.constants.roles import ROLES   # <-- your IntEnum

# ------------------------------------------------------------------
# Alembic bookkeeping – let Alembic generate the ID, keep it for reference
# ------------------------------------------------------------------
revision = "5fd238b97d05"      # <-- keep the same ID you already have
down_revision = None
branch_labels = None
depends_on = None


def _enum_values() -> str:
    """Return a SQL list of all enum labels, e.g. 'SUPER_ADMIN','ADMIN',..."""
    return ",".join(f"'{r.name}'" for r in ROLES)


def _int_to_enum_case() -> str:
    """CASE statement that maps old int → enum label"""
    lines = ["CASE role"]
    for r in ROLES:
        lines.append(f"    WHEN {r.value} THEN '{r.name}'")
    lines.append("    ELSE 'USER'")   # fallback
    lines.append("END")
    return "\n".join(lines)


def _enum_to_int_case() -> str:
    """CASE statement for downgrade (enum label → int)"""
    lines = ["CASE role"]
    for r in ROLES:
        lines.append(f"    WHEN '{r.name}' THEN {r.value}")
    lines.append("    ELSE 99")       # fallback
    lines.append("END")
    return "\n".join(lines)


def upgrade() -> None:
    # 1. CREATE ENUM TYPE
    op.execute(f"CREATE TYPE roles AS ENUM ({_enum_values()})")

    # 2. ADD TEMP COLUMN
    op.add_column(
        "user",
        sa.Column("role_tmp", sa.Enum("roles", name="roles"), nullable=True),
    )

    # 3. COPY DATA WITH CAST
    op.execute(
        f"UPDATE \"user\" SET role_tmp = {_int_to_enum_case()}::roles"
    )

    # 4. DROP OLD COLUMN
    op.drop_column("user", "role")

    # 5. RENAME + NOT NULL
    op.alter_column(
        "user",
        "role_tmp",
        new_column_name="role",
        nullable=False,
        existing_type=sa.Enum("roles", name="roles"),
    )
def downgrade() -> None:
    op.add_column("user", sa.Column("role_tmp", sa.Integer(), nullable=True))

    op.execute(
        f"UPDATE \"user\" SET role_tmp = {_enum_to_int_case()}"
    )

    op.drop_column("user", "role")
    op.alter_column(
        "user",
        "role_tmp",
        new_column_name="role",
        nullable=False,
        existing_type=sa.Integer(),
    )

    op.execute("DROP TYPE roles")