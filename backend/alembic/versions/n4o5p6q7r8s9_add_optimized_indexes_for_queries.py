"""Add optimized indexes for queries

Revision ID: n4o5p6q7r8s9
Revises: m3n4o5p6q7r8
Create Date: 2026-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'n4o5p6q7r8s9'
down_revision = 'm3n4o5p6q7r8'  # Latest migration: add_avatar_url_to_users
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add composite indexes for forecasts table (for top holders query)
    op.create_index(
        'idx_forecasts_market_user_points',
        'forecasts',
        ['market_id', 'user_id', 'points'],
        unique=False
    )
    op.create_index(
        'idx_forecasts_market_created',
        'forecasts',
        ['market_id', sa.text('created_at DESC')],
        unique=False
    )
    op.create_index(
        'idx_forecasts_user_market',
        'forecasts',
        ['user_id', 'market_id'],
        unique=False
    )
    
    # Add partial indexes for comments (filtering out deleted comments)
    op.create_index(
        'idx_comments_market_not_deleted',
        'comments',
        ['market_id', sa.text('created_at DESC')],
        postgresql_where=sa.text('is_deleted = false'),
        unique=False
    )
    op.create_index(
        'idx_comments_parent_not_deleted',
        'comments',
        ['parent_id', sa.text('created_at DESC')],
        postgresql_where=sa.text('is_deleted = false'),
        unique=False
    )
    
    # Add composite index for activity queries (market + type + created_at)
    op.create_index(
        'idx_activities_market_type_created',
        'activities',
        ['market_id', 'activity_type', sa.text('created_at DESC')],
        postgresql_where=sa.text('market_id IS NOT NULL'),
        unique=False
    )


def downgrade() -> None:
    # Drop indexes in reverse order
    op.drop_index('idx_activities_market_type_created', table_name='activities')
    op.drop_index('idx_comments_parent_not_deleted', table_name='comments')
    op.drop_index('idx_comments_market_not_deleted', table_name='comments')
    op.drop_index('idx_forecasts_user_market', table_name='forecasts')
    op.drop_index('idx_forecasts_market_created', table_name='forecasts')
    op.drop_index('idx_forecasts_market_user_points', table_name='forecasts')
