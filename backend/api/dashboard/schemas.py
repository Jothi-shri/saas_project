"""Schemas for dashboard feature."""

from __future__ import annotations

from pydantic import BaseModel

class DashboardStats(BaseModel):
    totalProjects: int = 0
    completedTasks: int = 0
    activeTeamMembers: int = 0
    revenueGrowth: float = 0.0
