"""Pydantic schemas for authentication."""

from __future__ import annotations

from pydantic import BaseModel

class RegisterIn(BaseModel):
    name: str
    email: str
    password: str

class LoginIn(BaseModel):
    email: str
    password: str

class AdminLoginIn(BaseModel):
    username: str
    password: str

class RefreshIn(BaseModel):
    refresh_token: str | None = None
