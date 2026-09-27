"""Schemas for tasks feature."""

from __future__ import annotations

from pydantic import BaseModel

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    projectId: str
    assigneeId: str | None = None
    status: str = "todo"
    priority: str = "medium"
    dueDate: str | None = None
