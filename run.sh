#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

PORT="${PORT:-5173}"
HOST="${HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"

MODE="dev"
FORCE_INSTALL=false
FRONTEND_ONLY=false
BACKEND_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --build)          MODE="build" ;;
    --install)        FORCE_INSTALL=true ;;
    --frontend-only)  FRONTEND_ONLY=true ;;
    --backend-only)   BACKEND_ONLY=true ;;
    --help|-h)
      sed -n '2,12p' "$0" | sed 's/^# //;s/^#//'
      exit 0
      ;;
    *) echo "Unknown option: $arg (try --help)" >&2; exit 1 ;;
  esac
done

info()  { printf "\033[1;34m[run.sh]\033[0m %s\n" "$*"; }
warn()  { printf "\033[1;33m[run.sh]\033[0m %s\n" "$*"; }
die()   { printf "\033[1;31m[run.sh]\033[0m %s\n" "$*" >&2; exit 1; }

if [[ ! -d "$FRONTEND_DIR" ]]; then
  die "frontend/ not found at $FRONTEND_DIR"
fi

if [[ -f "$PROJECT_ROOT/.env" ]]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

PYTHON_BIN="$PROJECT_ROOT/.venv/bin/python"

if [[ "$BACKEND_ONLY" == false ]]; then
  command -v node >/dev/null 2>&1 || die "node is not installed. Install Node.js >=18"
  command -v npm  >/dev/null 2>&1 || die "npm is not installed."
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "$NODE_MAJOR" -lt 18 ]]; then
    warn "Node $NODE_MAJOR detected — Vite recommends Node >=18."
  fi
fi

setup_backend() {
  if [[ ! -f "$BACKEND_DIR/main.py" && ! -f "$BACKEND_DIR/api/main.py" ]]; then
    warn "backend/main.py not found — skipping backend."
    return 1
  fi

  if [[ ! -d "$PROJECT_ROOT/.venv" ]]; then
    info "Creating Python virtual environment at .venv/ ..."
    if command -v uv >/dev/null 2>&1; then
      uv venv "$PROJECT_ROOT/.venv" 2>&1 | tail -n 5
    else
      python3 -m venv "$PROJECT_ROOT/.venv" 2>&1 | tail -n 5
    fi
    PYTHON_BIN="$PROJECT_ROOT/.venv/bin/python"
  else
    info ".venv already exists — skipping creation."
    PYTHON_BIN="$PROJECT_ROOT/.venv/bin/python"
  fi

  local need_sync=false
  if [[ "$FORCE_INSTALL" == true ]]; then
    need_sync=true
  elif ! "$PYTHON_BIN" -c "import fastapi, sqlalchemy, jwt" 2>/dev/null; then
    need_sync=true
  fi

  if [[ "$need_sync" == true ]]; then
    info "Installing backend dependencies from pyproject.toml (uv sync) ..."
    if command -v uv >/dev/null 2>&1; then
      if [[ -f "$PROJECT_ROOT/pyproject.toml" ]]; then
        (cd "$PROJECT_ROOT" && uv sync 2>&1 | tail -n 10)
      else
        die "pyproject.toml not found — cannot install backend deps"
      fi
    else
      die "uv is required — install from https://docs.astral.sh/uv/"
    fi
    PYTHON_BIN="$PROJECT_ROOT/.venv/bin/python"
  else
    info "Backend dependencies already installed — skipping uv sync."
  fi

  if [[ -f "$PROJECT_ROOT/alembic.ini" ]]; then
    info "Running Alembic migrations (postgresql) ..."
    if ! PYTHONPATH="$PROJECT_ROOT" "$PYTHON_BIN" -m alembic upgrade head 2>&1 | tail -n 20; then
      warn "Alembic upgrade failed — check DATABASE_URL and PostgreSQL connection."
    fi
  fi
  return 0
}

setup_frontend() {
  if [[ "$FORCE_INSTALL" == true ]]; then
    info "Force reinstall: running npm install ..."
    (cd "$FRONTEND_DIR" && npm install)
  elif [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    info "Installing frontend dependencies (node_modules missing) ..."
    (cd "$FRONTEND_DIR" && npm install)
  else
    info "Frontend dependencies already present — skipping npm install."
  fi
}

BACKEND_PID=""
FRONTEND_PID=""

start_backend() {
  info "Starting FastAPI backend on http://${BACKEND_HOST}:${BACKEND_PORT} ..."
  PYTHONPATH="$PROJECT_ROOT" "$PYTHON_BIN" -m uvicorn backend.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" --reload &
  BACKEND_PID=$!
  for i in {1..15}; do
    if curl -sf "http://${BACKEND_HOST}:${BACKEND_PORT}/health" >/dev/null 2>&1; then
      info "Backend ready at http://${BACKEND_HOST}:${BACKEND_PORT}"
      return 0
    fi
    sleep 0.5
  done
  warn "Backend did not become ready within 7s — continuing anyway (check logs)."
}

start_frontend() {
  if [[ "$MODE" == "build" ]]; then
    info "Building frontend for production ..."
    (cd "$FRONTEND_DIR" && npm run build)
    info "Starting frontend preview on http://localhost:${PORT} ..."
    (cd "$FRONTEND_DIR" && npx vite preview --host "$HOST" --port "$PORT") &
  else
    info "Starting React/Vite frontend on http://localhost:${PORT} ..."
    (cd "$FRONTEND_DIR" && npx vite --host "$HOST" --port "$PORT") &
  fi
  FRONTEND_PID=$!
}

cleanup() {
  info "Stopping services ..."
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  jobs -p | xargs -r kill 2>/dev/null || true
  if [[ -f /tmp/saas-backend.pid ]]; then
    kill "$(cat /tmp/saas-backend.pid)" 2>/dev/null || true
    rm -f /tmp/saas-backend.pid
  fi
  info "Cleanup done."
}
trap cleanup EXIT INT TERM

if [[ "$BACKEND_ONLY" == true ]]; then
  setup_backend
  start_backend
  info "Backend running alone. Press Ctrl+C to stop."
  wait "$BACKEND_PID"
  exit 0
fi

if [[ "$FRONTEND_ONLY" == true ]]; then
  setup_frontend
  start_frontend
  info "Frontend running alone at http://localhost:${PORT}. Press Ctrl+C to stop."
  wait "$FRONTEND_PID"
  exit 0
fi

info "Preparing SaaS project ..."

setup_backend
setup_frontend

start_backend
start_frontend

info "----------------------------------------"
info "SaaS project ready:"
info "  Backend  → http://${BACKEND_HOST}:${BACKEND_PORT} (docs at /docs)"
info "  Frontend → http://localhost:${PORT}"
info "Press Ctrl+C to stop both services."
info "----------------------------------------"

wait
