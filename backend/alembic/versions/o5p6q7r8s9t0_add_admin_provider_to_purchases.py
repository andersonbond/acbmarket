"""Add admin provider to purchases

Revision ID: o5p6q7r8s9t0
Revises: n4o5p6q7r8s9
Create Date: 2026-01-26 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'o5p6q7r8s9t0'
down_revision = 'n4o5p6q7r8s9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the existing check_provider constraint
    op.drop_constraint('check_provider', 'purchases', type_='check')
    
    # Recreate the constraint with 'admin' added to the allowed providers
    # Use raw SQL to create the check constraint
    op.execute(
        "ALTER TABLE purchases ADD CONSTRAINT check_provider CHECK (provider IN ('test', 'paymongo', 'terminal3', 'admin'))"
    )


def downgrade() -> None:
    # Drop the updated constraint
    op.drop_constraint('check_provider', 'purchases', type_='check')
    
    # Recreate the original constraint without 'admin'
    op.execute(
        "ALTER TABLE purchases ADD CONSTRAINT check_provider CHECK (provider IN ('test', 'paymongo', 'terminal3'))"
    )
