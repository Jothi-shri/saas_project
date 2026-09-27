"""Settings routes — per-user simple JSON stored in DB via User row or ephemeral."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import User
from ..auth.security import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("")
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "settings": {
            "theme": user.theme,
            "notificationsEnabled": True,
            "emailNotificationsEnabled": user.email_notifications_enabled,
            "weeklyAnalyticsDigestEnabled": user.weekly_analytics_digest_enabled,
            "displayName": user.name,
            "email": user.email,
            "role": user.role,
        },
        "user": user.public(),
    }

@router.put("")
def update_settings(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if "displayName" in payload and payload["displayName"]:
        new_name = str(payload["displayName"]).strip()
        if new_name and new_name != user.name:
            user.name = new_name
    if "theme" in payload and payload["theme"]:
        user.theme = str(payload["theme"])
    if "emailNotificationsEnabled" in payload:
        user.email_notifications_enabled = bool(payload["emailNotificationsEnabled"])
    if "weeklyAnalyticsDigestEnabled" in payload:
        user.weekly_analytics_digest_enabled = bool(payload["weeklyAnalyticsDigestEnabled"])
    db.commit()
    db.refresh(user)
    settings = {
        "theme": user.theme,
        "notificationsEnabled": True,
        "emailNotificationsEnabled": user.email_notifications_enabled,
        "weeklyAnalyticsDigestEnabled": user.weekly_analytics_digest_enabled,
        "displayName": user.name,
        "email": user.email,
    }
    for k, v in payload.items():
        if k not in settings:
            settings[k] = v
    return {"settings": settings, "user": user.public()}
