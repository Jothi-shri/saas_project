"""Tasks routes — database backed."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import Task, User
from ..auth.security import get_current_user
from .schemas import TaskCreate

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

def _next_task_id() -> str:
    return f"TSK-{secrets.token_hex(4).upper()}"

def _parse_due_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None

@router.get("")
def list_tasks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.scalars(select(Task).order_by(Task.updated_at.desc())).all()
    return {"tasks": [t.to_dict() for t in tasks]}

@router.get("/{task_id}")
def get_task(task_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return {"task": task.to_dict()}

@router.post("")
def create_task(payload: TaskCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    due = _parse_due_date(getattr(payload, "dueDate", None))
    for _ in range(3):
        tid = _next_task_id()
        if db.get(Task, tid):
            continue
        task = Task(
            id=tid,
            title=payload.title.strip(),
            description=payload.description or "",
            project_id=payload.projectId,
            assignee_id=getattr(payload, "assigneeId", None),
            status=payload.status or "todo",
            priority=payload.priority or "medium",
            due_date=due,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return {"task": task.to_dict()}
    raise HTTPException(500, "Could not create task")

@router.put("/{task_id}")
def update_task(task_id: str, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    if "title" in payload and payload["title"] is not None:
        task.title = str(payload["title"]).strip()
    if "description" in payload:
        task.description = str(payload["description"] or "")
    if "projectId" in payload and payload["projectId"]:
        task.project_id = str(payload["projectId"])
    if "assigneeId" in payload:
        task.assignee_id = payload["assigneeId"]
    if "status" in payload and payload["status"]:
        task.status = str(payload["status"])
    if "priority" in payload and payload["priority"]:
        task.priority = str(payload["priority"])
    if "dueDate" in payload:
        task.due_date = _parse_due_date(payload["dueDate"])
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return {"task": task.to_dict()}

@router.delete("/{task_id}")
def delete_task(task_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    db.delete(task)
    db.commit()
    return {"message": "deleted", "id": task_id}
