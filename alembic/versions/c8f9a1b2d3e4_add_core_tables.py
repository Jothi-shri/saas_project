"""add core tables: projects, tasks, team_members, notifications, activities

Revision ID: c8f9a1b2d3e4
Revises: 32dafe52adf8
Create Date: 2026-09-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c8f9a1b2d3e4'
down_revision: Union[str, Sequence[str], None] = '32dafe52adf8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('owner_id', sa.String(length=32), nullable=False),
        sa.Column('revenue', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'tasks',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('project_id', sa.String(length=32), nullable=False),
        sa.Column('assignee_id', sa.String(length=32), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tasks_project_id'), 'tasks', ['project_id'], unique=False)

    op.create_table(
        'team_members',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_team_members_email'), 'team_members', ['email'], unique=True)

    op.create_table(
        'notifications',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('read', sa.Boolean(), nullable=False),
        sa.Column('project_id', sa.String(length=32), nullable=True),
        sa.Column('user_id', sa.String(length=32), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'activities',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('team_member_id', sa.String(length=32), nullable=True),
        sa.Column('team_member_name', sa.String(length=100), nullable=False),
        sa.Column('action', sa.Text(), nullable=False),
        sa.Column('project_id', sa.String(length=32), nullable=True),
        sa.Column('task_id', sa.String(length=32), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('activities')
    op.drop_table('notifications')
    op.drop_index(op.f('ix_team_members_email'), table_name='team_members')
    op.drop_table('team_members')
    op.drop_index(op.f('ix_tasks_project_id'), table_name='tasks')
    op.drop_table('tasks')
    op.drop_table('projects')
