"""Team routes — database backed."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ...db.database import get_db
from ...db.models import TeamMember, User
from ..auth.security import get_current_user
from .schemas import TeamMemberCreate

router = APIRouter(prefix="/api/team", tags=["team"])

def _next_tm_id() -> str:
    return f"TM-{secrets.token_hex(4).upper()}"

@router.get("")
def list_team(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    members = db.scalars(select(TeamMember).order_by(TeamMember.created_at.desc())).all()
    return {"members": [m.to_dict() for m in members], "teamMembers": [m.to_dict() for m in members]}

@router.get("/{member_id}")
def get_member(member_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.get(TeamMember, member_id)
    if not m:
        raise HTTPException(404, "Team member not found")
    return {"member": m.to_dict()}

@router.post("")
def invite_member(payload: TeamMemberCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    existing = db.scalar(select(TeamMember).where(TeamMember.email == email))
    if existing:
        raise HTTPException(409, "Team member with this email already exists")
    for _ in range(3):
        tid = _next_tm_id()
        if db.get(TeamMember, tid):
            continue
        member = TeamMember(
            id=tid,
            name=payload.name.strip(),
            email=email,
            role=payload.role or "Analyst",
            status=getattr(payload, "status", None) or "invited",
            avatar_url=getattr(payload, "avatarUrl", None),
        )
        db.add(member)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, "Email already exists")
        db.refresh(member)
        return {"member": member.to_dict()}
    raise HTTPException(500, "Could not invite member")

@router.put("/{member_id}")
def update_member(member_id: str, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.get(TeamMember, member_id)
    if not m:
        raise HTTPException(404, "Team member not found")
    if "name" in payload and payload["name"] is not None:
        m.name = str(payload["name"]).strip()
    if "email" in payload and payload["email"]:
        m.email = str(payload["email"]).lower().strip()
    if "role" in payload and payload["role"]:
        m.role = str(payload["role"])
    if "status" in payload and payload["status"]:
        m.status = str(payload["status"])
    if "avatarUrl" in payload:
        m.avatar_url = payload["avatarUrl"]
    m.updated_at = datetime.now(timezone.utc)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already exists")
    db.refresh(m)
    return {"member": m.to_dict()}

@router.delete("/{member_id}")
def delete_member(member_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.get(TeamMember, member_id)
    if not m:
        raise HTTPException(404, "Team member not found")
    db.delete(m)
    db.commit()
    return {"message": "deleted", "id": member_id}
