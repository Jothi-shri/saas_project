"""Notifications routes — database backed."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import Notification, User
from ..auth.security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

def _next_notif_id() -> str:
    return f"NTF-{secrets.token_hex(4).upper()}"

@router.get("")
def list_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.scalars(select(Notification).order_by(Notification.created_at.desc())).all()
    return {"notifications": [n.to_dict() for n in notifs]}

@router.get("/{notif_id}")
def get_notification(notif_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.get(Notification, notif_id)
    if not n:
        raise HTTPException(404, "Notification not found")
    return {"notification": n.to_dict()}

@router.post("")
def create_notification(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for _ in range(3):
        nid = _next_notif_id()
        if db.get(Notification, nid):
            continue
        n = Notification(
            id=nid,
            title=str(payload.get("title") or "Notification"),
            message=str(payload.get("message") or ""),
            type=str(payload.get("type") or "info"),
            read=bool(payload.get("read", False)),
            project_id=payload.get("projectId"),
            user_id=user.id,
        )
        db.add(n)
        db.commit()
        db.refresh(n)
        return {"notification": n.to_dict()}
    raise HTTPException(500, "Could not create notification")

@router.put("/{notif_id}")
def update_notification(notif_id: str, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.get(Notification, notif_id)
    if not n:
        raise HTTPException(404, "Notification not found")
    if "title" in payload and payload["title"] is not None:
        n.title = str(payload["title"])
    if "message" in payload:
        n.message = str(payload["message"] or "")
    if "type" in payload and payload["type"]:
        n.type = str(payload["type"])
    if "read" in payload:
        n.read = bool(payload["read"])
    db.commit()
    db.refresh(n)
    return {"notification": n.to_dict()}

@router.post("/mark-all-read")
def mark_all_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.scalars(select(Notification).where(Notification.read == False)).all()  # noqa: E712
    for n in notifs:
        n.read = True
    db.commit()
    return {"updated": len(notifs)}

@router.delete("/{notif_id}")
def delete_notification(notif_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.get(Notification, notif_id)
    if not n:
        raise HTTPException(404, "Notification not found")
    db.delete(n)
    db.commit()
    return {"message": "deleted", "id": notif_id}
