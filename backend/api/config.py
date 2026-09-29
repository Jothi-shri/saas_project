"""Central settings for JWT, cookies, CORS and database — env-driven."""

from __future__ import annotations

import os

from dotenv import load_dotenv
from pathlib import Path

_project_root = Path(__file__).resolve().parents[2]
load_dotenv(_project_root / ".env", override=False)
load_dotenv(override=False)

def _env_bool(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).lower() in ("1", "true", "yes", "on")

class Settings:
    # No default secret is shipped — set JWT_SECRET in .env (local) or on
    # Render (production). Empty here so a missing secret fails visibly
    # instead of deploying with a publicly known value.
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_access_ttl_hours: float = float(os.getenv("JWT_ACCESS_TTL_HOURS", "0.25"))
    jwt_refresh_ttl_hours: float = float(os.getenv("JWT_REFRESH_TTL_HOURS", "24"))

    database_url: str = os.getenv("DATABASE_URL", "")
    if not database_url:
        database_url = ""

    refresh_cookie_name: str = os.getenv("REFRESH_COOKIE_NAME", "refresh_token")
    refresh_cookie_path: str = os.getenv("REFRESH_COOKIE_PATH", "/")
    refresh_cookie_secure: bool = _env_bool("COOKIE_SECURE", "false") 
    refresh_cookie_httponly: bool = True
    refresh_cookie_samesite: str = os.getenv("COOKIE_SAMESITE", "lax")  
    refresh_cookie_domain: str | None = os.getenv("COOKIE_DOMAIN") or None

    cors_origins: list[str] = [
        o.strip() for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,https://saasproject-app.netlify.app",
        ).split(",") if o.strip()
    ]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

    password_reset_ttl_minutes: int = int(os.getenv("PASSWORD_RESET_TTL_MINUTES", "60"))

    email_provider: str = os.getenv("EMAIL_PROVIDER", "console")
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    mail_from: str = os.getenv("MAIL_FROM", "SaaS Platform <no-reply@localhost>")
    email_from_name: str = os.getenv("EMAIL_FROM_NAME", "SaaS Platform")

    def validate(self) -> None:
        if not self.database_url:
            raise RuntimeError(
                "DATABASE_URL is not set. Please create a .env file with "
                "DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE"
            )
        if not self.database_url.startswith("postgresql"):
            raise RuntimeError(f"DATABASE_URL must be a PostgreSQL URL, got: {self.database_url}")

settings = Settings()
try:
    settings.validate()
except RuntimeError as e:
    if os.getenv("ALEMBIC_BYPASS_VALIDATION") != "1":
        import warnings
        warnings.warn(str(e))
