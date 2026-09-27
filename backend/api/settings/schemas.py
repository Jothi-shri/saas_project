"""Schemas for settings feature."""

from __future__ import annotations

from pydantic import BaseModel

class SettingsUpdate(BaseModel):
    theme: str | None = None
    notificationsEnabled: bool | None = None
