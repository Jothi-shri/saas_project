"""Authentication routes — register / login / me / refresh."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Response, Request, Cookie
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import settings
from ...db.database import get_db
from ...db.models import User
from .schemas import RegisterIn, LoginIn, AdminLoginIn, RefreshIn
from .security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/system/auth", tags=["auth"])

__all__ = [
    "router",
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "make_token",
    "make_refresh_token",
    "get_current_user",
    "current_user",
]

def make_token(user: User, ttl_hours: float | None = None) -> str:
    return create_access_token(user, ttl_hours=ttl_hours)

def make_refresh_token(user: User) -> str:
    return create_refresh_token(user)

def _next_user_id(db: Session) -> str:
    return f"USR-{secrets.token_hex(3).upper()}"

def current_user(*args, **kwargs):
    return get_current_user(*args, **kwargs)

def _refresh_cookie_max_age() -> int:
    return int(settings.jwt_refresh_ttl_hours * 3600)

def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=_refresh_cookie_max_age(),
        httponly=settings.refresh_cookie_httponly,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        path=settings.refresh_cookie_path,
        domain=settings.refresh_cookie_domain,
    )

def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        domain=settings.refresh_cookie_domain,
        secure=settings.refresh_cookie_secure,
        httponly=settings.refresh_cookie_httponly,
        samesite=settings.refresh_cookie_samesite,
    )

def _auth_response(user: User, response: Response) -> dict:
    """Return access token + user, set refresh token as HttpOnly cookie."""
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)
    _set_refresh_cookie(response, refresh_token)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.public(),
    }

@router.post("/register")
def register(body: RegisterIn, response: Response, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    exists = db.scalar(select(User).where(func.lower(User.email) == email))
    if exists:
        raise HTTPException(409, "An account with this email already exists")
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    for _ in range(3):
        user = User(
            id=_next_user_id(db),
            name=body.name.strip(),
            email=email,
            password_hash=hash_password(body.password),
            role="Analyst",
            status="Active",
        )
        db.add(user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            if db.scalar(select(User).where(func.lower(User.email) == email)):
                raise HTTPException(409, "An account with this email already exists")
            continue
        break
    else:
        raise HTTPException(500, "Could not create account, please retry")
    db.refresh(user)
    return _auth_response(user, response)

@router.post("/login")
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where(func.lower(User.email) == body.email.lower().strip())
    )
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    if user.status != "Active":
        raise HTTPException(403, "Account is inactive")
    return _auth_response(user, response)

@router.post("/admin-login")
def admin_login(body: AdminLoginIn, response: Response, db: Session = Depends(get_db)):
    username_clean = body.username.lower().strip()
    user = db.scalar(
        select(User).where(
            or_(
                func.lower(User.name) == username_clean,
                func.lower(User.email) == username_clean,
            )
        )
    )
    if not user and "@" not in username_clean:
        user = db.scalar(
            select(User).where(func.lower(User.email).like(f"{username_clean}@%"))
        )
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid username or password")
    if user.status != "Active":
        raise HTTPException(403, "Account is inactive")
    if user.role != "Admin":
        raise HTTPException(403, "Account does not have admin privileges")
    return _auth_response(user, response)

@router.post("/refresh")
def refresh(
    request: Request,
    response: Response,
    body: RefreshIn | None = None,
    refresh_token: str | None = Cookie(default=None, alias=settings.refresh_cookie_name),
):
    """Validate refresh cookie and issue a new short-lived access token.

    Reads HttpOnly refresh_token cookie (set by login). No refresh token is
    exposed to JavaScript. Returns 401 if missing/expired/invalid so frontend
    can clear state and redirect to /.
    """
    token = refresh_token
    if not token and body and body.refresh_token:
        token = body.refresh_token
    if not token:
        token = request.cookies.get(settings.refresh_cookie_name)
    if not token:
        raise HTTPException(401, "Missing refresh token")

    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Refresh token has expired")
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired refresh token")

    if payload.get("type") and payload["type"] != "refresh":
        raise HTTPException(401, "Invalid token type")

    now = datetime.now(timezone.utc)
    access_payload = {
        "sub": payload["sub"],
        "email": payload["email"],
        "role": payload["role"],
        "iat": now,
        "exp": now + timedelta(hours=settings.jwt_access_ttl_hours),
        "type": "access",
    }
    access_token = jwt.encode(access_payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    """Clear refresh cookie and instruct frontend to clear memory state."""
    _clear_refresh_cookie(response)
    return {"message": "Logged out"}

@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user.public()
