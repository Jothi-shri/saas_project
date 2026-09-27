"""Schemas for notifications feature."""

from __future__ import annotations

from pydantic import BaseModel

class Notification(BaseModel):
    id: str
    title: str
    message: str
    read: bool = False
