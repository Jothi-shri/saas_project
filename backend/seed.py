from __future__ import annotations

from datetime import datetime, timezone, timedelta
import secrets

from sqlalchemy import select, func

from backend.db.database import SessionLocal
from backend.db.models import Project, Task, TeamMember, Notification, Activity, User

def seed_users(db) -> int:
    return 0

def _seed_projects(db) -> int:
    existing = db.scalar(select(func.count()).select_from(Project))
    if existing and existing > 0:
        return 0
    from backend.db.models import User
    owner = db.scalars(select(User).limit(1)).first()
    owner_id = owner.id if owner else "USR-SYSTEM"
    samples = [
        {"id": "p1", "name": "Atlas CRM", "description": "Customer pipeline and revenue analytics", "status": "active", "revenue": 42000},
        {"id": "p2", "name": "Beacon Launch", "description": "Marketing site and onboarding flow", "status": "planning", "revenue": 18000},
        {"id": "p3", "name": "Northwind Ops", "description": "Operations dashboard for logistics", "status": "completed", "revenue": 25000},
        {"id": "p4", "name": "Pulse Analytics", "description": "Real-time user analytics", "status": "active", "revenue": 31000},
    ]
    now = datetime.now(timezone.utc)
    created = 0
    for s in samples:
        p = Project(
            id=s["id"],
            name=s["name"],
            description=s["description"],
            status=s["status"],
            owner_id=owner_id,
            revenue=s["revenue"],
            created_at=now - timedelta(days=created),
            updated_at=now,
        )
        db.add(p)
        created += 1
    db.commit()
    return created

def _seed_tasks(db) -> int:
    existing = db.scalar(select(func.count()).select_from(Task))
    if existing and existing > 0:
        return 0
    now = datetime.now(timezone.utc)
    samples = [
        {"id": "t1", "title": "Design onboarding flow", "description": "Wireframes for new signup", "projectId": "p1", "assigneeId": "tm1", "status": "in_progress", "priority": "high", "dueDate": (now + timedelta(days=5)).isoformat()},
        {"id": "t2", "title": "Integrate billing webhook", "description": "Stripe events to analytics", "projectId": "p1", "assigneeId": "tm2", "status": "todo", "priority": "medium", "dueDate": (now + timedelta(days=10)).isoformat()},
        {"id": "t3", "title": "QA analytics dashboard", "description": "Test revenue charts", "projectId": "p4", "assigneeId": "tm3", "status": "done", "priority": "low", "dueDate": (now - timedelta(days=5)).isoformat()},
        {"id": "t4", "title": "Fix authentication bug", "description": "Resolve login validation", "projectId": "p1", "assigneeId": "tm1", "status": "todo", "priority": "high", "dueDate": now.isoformat()},
        {"id": "t5", "title": "Update dashboard UI", "description": "Refresh analytics widgets", "projectId": "p4", "assigneeId": "tm2", "status": "in_progress", "priority": "medium", "dueDate": (now + timedelta(days=1)).isoformat()},
    ]
    created = 0
    for s in samples:
        due = None
        try:
            due = datetime.fromisoformat(s["dueDate"].replace("Z", "+00:00"))
        except:
            due = None
        t = Task(
            id=s["id"],
            title=s["title"],
            description=s["description"],
            project_id=s["projectId"],
            assignee_id=s["assigneeId"],
            status=s["status"],
            priority=s["priority"],
            due_date=due,
            created_at=now - timedelta(hours=created*2),
            updated_at=now,
        )
        db.add(t)
        created += 1
    db.commit()
    return created

def _seed_team(db) -> int:
    existing = db.scalar(select(func.count()).select_from(TeamMember))
    if existing and existing > 0:
        return 0
    now = datetime.now(timezone.utc)
    samples = [
        {"id": "tm1", "name": "Alex Morgan", "email": "alex@saas.co", "role": "Supervisor", "status": "active"},
        {"id": "tm2", "name": "Jamie Chen", "email": "jamie@saas.co", "role": "Analyst", "status": "active"},
        {"id": "tm3", "name": "Samir Patel", "email": "samir@saas.co", "role": "Technician", "status": "invited"},
        {"id": "tm4", "name": "Riley Sato", "email": "riley@saas.co", "role": "Admin", "status": "offline"},
    ]
    created = 0
    for s in samples:
        m = TeamMember(
            id=s["id"],
            name=s["name"],
            email=s["email"],
            role=s["role"],
            status=s["status"],
            created_at=now,
            updated_at=now,
        )
        db.add(m)
        created += 1
    db.commit()
    return created

def _seed_notifications(db) -> int:
    existing = db.scalar(select(func.count()).select_from(Notification))
    if existing and existing > 0:
        return 0
    now = datetime.now(timezone.utc)
    samples = [
        {"id": "n1", "title": "New comment on Atlas CRM", "message": "Alex Morgan commented: 'Looks great — let's ship'", "type": "info", "read": False, "projectId": "p1", "created_at": now},
        {"id": "n2", "title": "Task overdue", "message": "Task 'Integrate billing webhook' is overdue by 2 days", "type": "warning", "read": False, "projectId": "p1", "created_at": now - timedelta(hours=1)},
        {"id": "n3", "title": "Invite accepted", "message": "Jamie Chen joined your team", "type": "success", "read": True, "projectId": None, "created_at": now - timedelta(days=1)},
    ]
    created = 0
    for s in samples:
        n = Notification(
            id=s["id"],
            title=s["title"],
            message=s["message"],
            type=s["type"],
            read=s["read"],
            project_id=s["projectId"],
            created_at=s["created_at"],
        )
        db.add(n)
        created += 1
    db.commit()
    return created

def _seed_activities(db) -> int:
    existing = db.scalar(select(func.count()).select_from(Activity))
    if existing and existing > 0:
        return 0
    now = datetime.now(timezone.utc)
    samples = [
        {"id": "a1", "teamMemberId": "tm1", "teamMemberName": "Alex Morgan", "action": "completed task 'Design onboarding flow'", "projectId": "p1", "taskId": "t1", "timestamp": now - timedelta(minutes=10)},
        {"id": "a2", "teamMemberId": "tm2", "teamMemberName": "Jamie Chen", "action": "created project 'Pulse Analytics'", "projectId": "p4", "taskId": None, "timestamp": now - timedelta(minutes=32)},
        {"id": "a3", "teamMemberId": "tm3", "teamMemberName": "Samir Patel", "action": "commented on task 'QA analytics dashboard'", "projectId": "p4", "taskId": "t3", "timestamp": now - timedelta(hours=1)},
        {"id": "a4", "teamMemberId": "tm1", "teamMemberName": "John", "action": "completed Update landing page", "projectId": "p1", "taskId": None, "timestamp": now - timedelta(minutes=10)},
        {"id": "a5", "teamMemberId": "tm2", "teamMemberName": "Sarah", "action": "created a new project", "projectId": None, "taskId": None, "timestamp": now - timedelta(minutes=32)},
    ]
    created = 0
    for s in samples:
        a = Activity(
            id=s["id"],
            team_member_id=s["teamMemberId"],
            team_member_name=s["teamMemberName"],
            action=s["action"],
            project_id=s["projectId"],
            task_id=s["taskId"],
            timestamp=s["timestamp"],
        )
        db.add(a)
        created += 1
    db.commit()
    return created

def seed_all(db) -> dict:
    results = {}
    results["projects"] = _seed_projects(db)
    results["tasks"] = _seed_tasks(db)
    results["team_members"] = _seed_team(db)
    results["notifications"] = _seed_notifications(db)
    results["activities"] = _seed_activities(db)
    return results

def main() -> None:
    print("[seed] Seeding PostgreSQL via SQLAlchemy...")
    db = SessionLocal()
    try:
        created_users = seed_users(db)
        print(f"[seed] Users: {created_users}")
        results = seed_all(db)
        for k, v in results.items():
            print(f"[seed] {k}: {v} new")
        if all(v == 0 for v in results.values()) and created_users == 0:
            print("[seed] No new data — already seeded.")
        else:
            print(f"[seed] Created {sum(results.values())} new records.")
        print("[seed] Done.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
