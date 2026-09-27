"""FastAPI entry point — feature-based router registration."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth.router import router as auth_router
from .dashboard.router import router as dashboard_router
from .projects.router import router as projects_router
from .tasks.router import router as tasks_router
from .team.router import router as team_router
from .analytics.router import router as analytics_router
from .notifications.router import router as notifications_router
from .settings.router import router as settings_router
from .activities.router import router as activities_router
from .config import settings

app = FastAPI(title="SaaS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

app.include_router(auth_router)

app.include_router(dashboard_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(team_router)
app.include_router(analytics_router)
app.include_router(notifications_router)
app.include_router(settings_router)
app.include_router(activities_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "SaaS API running. See /docs for OpenAPI."}
