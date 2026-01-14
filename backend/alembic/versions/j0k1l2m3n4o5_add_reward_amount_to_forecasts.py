"""add_reward_amount_to_forecasts

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-01-08 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'j0k1l2m3n4o5'
down_revision = 'i9j0k1l2m3n4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add reward_amount column to forecasts table
    op.add_column('forecasts', sa.Column('reward_amount', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove reward_amount column from forecasts table
    op.drop_column('forecasts', 'reward_amount')
