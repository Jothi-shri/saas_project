"""Activities routes — database backed."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import Activity, User
from ..auth.security import get_current_user

router = APIRouter(prefix="/api/activities", tags=["activities"])

def _next_activity_id() -> str:
    return f"ACT-{secrets.token_hex(4).upper()}"

@router.get("")
def list_activities(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    acts = db.scalars(select(Activity).order_by(Activity.timestamp.desc()).limit(50)).all()
    return {"activities": [a.to_dict() for a in acts], "activity": [a.to_dict() for a in acts]}

@router.post("")
def create_activity(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for _ in range(3):
        aid = _next_activity_id()
        if db.get(Activity, aid):
            continue
        act = Activity(
            id=aid,
            team_member_id=payload.get("teamMemberId"),
            team_member_name=str(payload.get("teamMemberName") or user.name),
            action=str(payload.get("action") or ""),
            project_id=payload.get("projectId"),
            task_id=payload.get("taskId"),
        )
        db.add(act)
        db.commit()
        db.refresh(act)
        return {"activity": act.to_dict()}
    raise HTTPException(500, "Could not create activity")

@router.delete("/{activity_id}")
def delete_activity(activity_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.get(Activity, activity_id)
    if not a:
        raise HTTPException(404, "Activity not found")
    db.delete(a)
    db.commit()
    return {"message": "deleted", "id": activity_id}
