"""Schemas for projects feature."""

from __future__ import annotations

from pydantic import BaseModel

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    status: str = "planning"
    revenue: int | None = None

class Project(BaseModel):
    id: str
    name: str
    description: str
    status: str
    ownerId: str
