"""make_email_optional

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2026-01-08 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'k1l2m3n4o5p6'
down_revision = 'j0k1l2m3n4o5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make email nullable and remove unique constraint
    # Drop the unique index (which enforces uniqueness in PostgreSQL)
    op.drop_index('ix_users_email', table_name='users')
    
    # Alter the column to be nullable
    op.alter_column('users', 'email',
                    existing_type=sa.String(),
                    nullable=True,
                    existing_nullable=False)
    
    # Recreate index (non-unique)
    op.create_index('ix_users_email', 'users', ['email'], unique=False)


def downgrade() -> None:
    # Make email required again and add unique constraint
    # First, update any NULL emails to placeholder values
    op.execute("UPDATE users SET email = 'user_' || id || '@acbmarket.local' WHERE email IS NULL")
    
    # Make column not nullable
    op.alter_column('users', 'email',
                    existing_type=sa.String(),
                    nullable=False,
                    existing_nullable=True)
    
    # Drop non-unique index and recreate as unique
    op.drop_index('ix_users_email', table_name='users')
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
