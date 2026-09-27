"""Projects routes — database backed."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import Project, User
from ..auth.security import get_current_user
from .schemas import ProjectCreate

router = APIRouter(prefix="/api/projects", tags=["projects"])

def _next_project_id() -> str:
    return f"PRJ-{secrets.token_hex(4).upper()}"

@router.get("")
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.scalars(select(Project).order_by(Project.updated_at.desc())).all()
    return {"projects": [p.to_dict() for p in projects]}

@router.get("/{project_id}")
def get_project(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return {"project": project.to_dict()}

@router.post("")
def create_project(payload: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    revenue = payload.revenue if getattr(payload, "revenue", None) is not None else (len(payload.name) * 3500 + 8000)
    for _ in range(3):
        pid = _next_project_id()
        if db.get(Project, pid):
            continue
        project = Project(
            id=pid,
            name=payload.name.strip(),
            description=payload.description or "",
            status=payload.status or "planning",
            owner_id=user.id,
            revenue=revenue,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return {"project": project.to_dict()}
    raise HTTPException(500, "Could not create project")

@router.put("/{project_id}")
def update_project(project_id: str, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    if "name" in payload and payload["name"] is not None:
        project.name = str(payload["name"]).strip()
    if "description" in payload:
        project.description = str(payload["description"] or "")
    if "status" in payload and payload["status"]:
        project.status = str(payload["status"])
    if "revenue" in payload and payload["revenue"] is not None:
        try:
            project.revenue = int(payload["revenue"])
        except:
            pass
    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)
    return {"project": project.to_dict()}

@router.delete("/{project_id}")
def delete_project(project_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    db.delete(project)
    db.commit()
    return {"message": "deleted", "id": project_id}
