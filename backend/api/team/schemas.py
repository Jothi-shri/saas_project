"""Schemas for team feature."""

from __future__ import annotations

from pydantic import BaseModel

class TeamMemberCreate(BaseModel):
    name: str
    email: str
    role: str = "Analyst"
    status: str = "invited"
    avatarUrl: str | None = None
