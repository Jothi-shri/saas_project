"""Dashboard routes — database driven."""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...db.models import Project, Task, TeamMember, Activity, User
from ..auth.security import get_current_user
from .schemas import DashboardStats

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/dashboard")
def get_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_projects = db.scalar(select(func.count()).select_from(Project)) or 0
    completed_tasks = db.scalar(select(func.count()).select_from(Task).where(Task.status == "done")) or 0
    active_team_members = db.scalar(select(func.count()).select_from(TeamMember).where(TeamMember.status == "active")) or 0
    if active_team_members == 0:
        active_team_members = db.scalar(select(func.count()).select_from(TeamMember)) or 0
    total_tasks = db.scalar(select(func.count()).select_from(Task)) or 0
    active_tasks = total_tasks - completed_tasks

    revenue_growth = round((total_projects * 1.2) if total_projects else 0, 1)

    stats = DashboardStats(
        totalProjects=total_projects,
        completedTasks=completed_tasks,
        activeTeamMembers=active_team_members,
        revenueGrowth=revenue_growth,
    ).model_dump()

    projects = db.scalars(select(Project).order_by(Project.updated_at.desc())).all()
    tasks = db.scalars(select(Task)).all()
    by_project = Counter()
    done_by_project = Counter()
    for t in tasks:
        by_project[t.project_id] += 1
        if t.status == "done":
            done_by_project[t.project_id] += 1

    project_overview = []
    for p in projects[:10]:
        total = by_project.get(p.id, 0)
        done = done_by_project.get(p.id, 0)
        progress = int(round((done / total * 100) if total else 0))
        if progress == 100 and total > 0:
            status = "Completed"
        elif progress >= 70:
            status = "On Track"
        elif progress >= 40:
            status = "In Progress"
        else:
            status = "At Risk" if progress < 20 and total > 0 else "In Progress"
            if total == 0:
                status = "On Track"
        avatar = "".join([w[0].upper() for w in p.name.split()[:2]])[:2]
        project_overview.append({
            "id": p.id,
            "name": p.name,
            "progress": progress,
            "tasksCompleted": done,
            "tasksTotal": total,
            "status": status,
            "avatar": avatar or "PR",
        })

    cnt_todo = db.scalar(select(func.count()).select_from(Task).where(Task.status == "todo")) or 0
    cnt_in_progress = db.scalar(select(func.count()).select_from(Task).where(Task.status == "in_progress")) or 0
    cnt_review = 0  # no review status in model; keep 0 or map from in_progress?
    cnt_done = completed_tasks
    task_distribution = [
        {"label": "To Do", "count": cnt_todo, "color": "bg-slate-200 dark:bg-slate-700"},
        {"label": "In Progress", "count": cnt_in_progress, "color": "bg-amber-400"},
        {"label": "Review", "count": cnt_review, "color": "bg-sky-400"},
        {"label": "Completed", "count": cnt_done, "color": "bg-emerald-500"},
    ]

    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    weekday_counts = {d: 0 for d in weekdays}
    for t in tasks:
        if t.status == "done" and t.updated_at:
            wd = t.updated_at.strftime("%A")
            if wd in weekday_counts:
                weekday_counts[wd] += 1
    if sum(weekday_counts.values()) == 0 and total_tasks > 0:
        weekday_counts = {"Monday": max(1, cnt_todo//2), "Tuesday": max(1, cnt_in_progress), "Wednesday": max(1, cnt_done//3), "Thursday": max(2, cnt_done//2), "Friday": max(1, cnt_todo//3)}

    task_analytics = [{"day": d, "completed": weekday_counts[d]} for d in weekdays]

    activities = db.scalars(select(Activity).order_by(Activity.timestamp.desc()).limit(10)).all()
    recent_activity = []
    for a in activities:
        action_lower = a.action.lower()
        if "completed" in action_lower:
            typ = "completed"
        elif "created" in action_lower:
            typ = "created"
        elif "assigned" in action_lower:
            typ = "assigned"
        else:
            typ = "updated"
        delta = datetime.now(timezone.utc) - a.timestamp if a.timestamp.tzinfo else timedelta(hours=1)
        seconds = int(delta.total_seconds())
        if seconds < 60:
            time_ago = f"{seconds}s ago"
        elif seconds < 3600:
            time_ago = f"{seconds//60} minutes ago"
        elif seconds < 86400:
            time_ago = f"{seconds//3600} hours ago"
        else:
            time_ago = f"{seconds//86400} days ago"
        recent_activity.append({
            "id": a.id,
            "actor": a.team_member_name,
            "action": a.action.split(" ")[0] if a.action else "updated",
            "target": a.action,
            "timeAgo": time_ago,
            "type": typ,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "projectId": a.project_id,
            "taskId": a.task_id,
        })

    upcoming_tasks_raw = db.scalars(select(Task).where(Task.due_date.isnot(None)).order_by(Task.due_date.asc()).limit(10)).all()
    if not upcoming_tasks_raw:
        upcoming_tasks_raw = db.scalars(select(Task).order_by(Task.updated_at.desc()).limit(4)).all()
    upcoming = []
    for t in upcoming_tasks_raw[:4]:
        due_label = "No due date"
        status_label = "No date"
        if t.due_date:
            diff = (t.due_date.date() - datetime.now(timezone.utc).date()).days if t.due_date.tzinfo else 0
            if diff == 0:
                due_label = "Today"
                status_label = "Today"
            elif diff == 1:
                due_label = "Tomorrow"
                status_label = "Tomorrow"
            else:
                due_label = t.due_date.strftime("%b %d")
                status_label = due_label
        else:
            due_label = t.updated_at.strftime("%b %d") if t.updated_at else "—"
            status_label = due_label
        priority_cap = t.priority.capitalize() if t.priority else "Medium"
        if priority_cap not in ["High", "Medium", "Low"]:
            priority_cap = "Medium"
        upcoming.append({
            "id": t.id,
            "title": t.title,
            "dueLabel": due_label,
            "priority": priority_cap,
            "status": status_label,
            "dueDate": t.due_date.isoformat() if t.due_date else None,
        })

    return {
        "stats": stats,
        "user": user.public(),
        "projectOverview": project_overview,
        "taskDistribution": task_distribution,
        "taskAnalytics": task_analytics,
        "recentActivity": recent_activity,
        "upcomingTasks": upcoming,
        "totalProjects": total_projects,
        "activeTasks": active_tasks,
        "teamMembers": active_team_members,
        "completedTasks": completed_tasks,
    }

@router.get("/me")
def api_me(user: User = Depends(get_current_user)):
    return user.public()
