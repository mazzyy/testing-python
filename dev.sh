#!/usr/bin/env bash
#
# CampusConsult — local development launcher
#
#   ./dev.sh              start database + backend + frontend
#   ./dev.sh db           start only Postgres
#   ./dev.sh backend      start only the API (starts Postgres first)
#   ./dev.sh frontend     start only the Vite dev server
#   ./dev.sh stop         stop everything, including the database container
#   ./dev.sh reset-db     DESTROY the database volume and recreate it empty
#   ./dev.sh logs         tail backend + frontend logs
#
# Ctrl+C stops the app processes. The Postgres container keeps running
# so the next start is fast — use "./dev.sh stop" to shut it down too.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
LOGS="$ROOT/logs"
ENV_FILE="$BACKEND/.env"

BACKEND_PORT=8000
FRONTEND_PORT=3000

mkdir -p "$LOGS"

# ── output helpers ───────────────────────────────────────────────
if [ -t 1 ]; then
  C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_GRN=$'\033[32m'
  C_YEL=$'\033[33m'; C_RED=$'\033[31m'; C_CYN=$'\033[36m'; C_BLD=$'\033[1m'
else
  C_RESET=""; C_DIM=""; C_GRN=""; C_YEL=""; C_RED=""; C_CYN=""; C_BLD=""
fi

step() { printf "%s==>%s %s\n" "$C_CYN$C_BLD" "$C_RESET$C_BLD" "$1$C_RESET"; }
ok()   { printf "  %s✓%s %s\n" "$C_GRN" "$C_RESET" "$1"; }
warn() { printf "  %s!%s %s\n" "$C_YEL" "$C_RESET" "$1"; }
die()  { printf "  %s✗%s %s\n" "$C_RED" "$C_RESET" "$1" >&2; exit 1; }
dim()  { printf "    %s%s%s\n" "$C_DIM" "$1" "$C_RESET"; }

# ── docker compose (v2 plugin or legacy binary) ──────────────────
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  DC=""
fi

# ── preflight ────────────────────────────────────────────────────
preflight() {
  step "Checking prerequisites"

  command -v docker >/dev/null 2>&1 || die "docker not found — install Docker Desktop and start it"
  docker info >/dev/null 2>&1 || die "Docker is installed but not running — start Docker Desktop and retry"
  [ -n "$DC" ] || die "docker compose not available"
  ok "docker"

  command -v python3 >/dev/null 2>&1 || die "python3 not found"
  ok "python3 ($(python3 --version 2>&1 | awk '{print $2}'))"

  command -v node >/dev/null 2>&1 || die "node not found — install Node 18+"
  ok "node ($(node --version))"

  if [ ! -f "$ENV_FILE" ]; then
    die "missing backend/.env — copy backend/.env.example and fill in your keys"
  fi
  ok "backend/.env"
}

# ── database ─────────────────────────────────────────────────────
start_db() {
  step "Starting Postgres"
  (cd "$ROOT" && $DC up -d db >/dev/null)

  # Resolve the published host port from compose rather than assuming 5432/5433
  DB_HOST_PORT="$(cd "$ROOT" && $DC port db 5432 2>/dev/null | awk -F: '{print $NF}')"
  [ -n "${DB_HOST_PORT:-}" ] || DB_HOST_PORT=5433

  printf "  waiting for Postgres"
  local tries=0
  until (cd "$ROOT" && $DC exec -T db pg_isready -U uniadvisor -d uniadvisor_db >/dev/null 2>&1); do
    tries=$((tries + 1))
    if [ "$tries" -ge 60 ]; then
      printf "\n"
      die "Postgres did not become ready — check: $DC logs db"
    fi
    printf "."
    sleep 1
  done
  printf "\n"
  ok "Postgres ready on localhost:$DB_HOST_PORT"
}

# The .env ships with port 5432, but compose publishes 5433. Rather than
# editing the user's .env, build a corrected URL and export it — pydantic
# settings give real environment variables priority over the .env file.
export_db_url() {
  local raw
  raw="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'"'' || true)"
  [ -n "$raw" ] || raw="postgresql://uniadvisor:uniadvisor_password@localhost:5432/uniadvisor_db"

  # swap whatever port is in the URL for the one compose actually published
  local fixed
  fixed="$(printf '%s' "$raw" | sed -E "s#@([^:/]+):[0-9]+/#@\1:${DB_HOST_PORT}/#")"

  export DATABASE_URL="$fixed"
  export POSTGRES_URL="$fixed"

  if [ "$fixed" != "$raw" ]; then
    dim "DATABASE_URL port remapped to $DB_HOST_PORT for this run"
  fi

  # Keep password-reset and verification links pointing at localhost in dev
  export FRONTEND_URL="http://localhost:$FRONTEND_PORT"
}

# ── backend ──────────────────────────────────────────────────────
setup_backend() {
  step "Preparing backend"

  if [ ! -d "$BACKEND/venv" ]; then
    dim "creating virtualenv"
    python3 -m venv "$BACKEND/venv"
  fi

  # Reinstall only when requirements.txt changed since the last install
  local stamp="$BACKEND/venv/.requirements.sha"
  local current
  current="$(shasum -a 256 "$BACKEND/requirements.txt" | awk '{print $1}')"

  if [ ! -f "$stamp" ] || [ "$(cat "$stamp")" != "$current" ]; then
    dim "installing python dependencies (first run takes a few minutes)"
    "$BACKEND/venv/bin/pip" install --quiet --upgrade pip
    "$BACKEND/venv/bin/pip" install --quiet -r "$BACKEND/requirements.txt"
    printf '%s' "$current" > "$stamp"
    ok "dependencies installed"
  else
    ok "dependencies up to date"
  fi
}

start_backend() {
  step "Starting API on :$BACKEND_PORT"

  if lsof -ti ":$BACKEND_PORT" >/dev/null 2>&1; then
    die "port $BACKEND_PORT is already in use — run ./dev.sh stop, or: lsof -ti :$BACKEND_PORT | xargs kill"
  fi

  (
    cd "$BACKEND"
    exec "$BACKEND/venv/bin/uvicorn" app.main:app --reload --host 0.0.0.0 --port "$BACKEND_PORT"
  ) > "$LOGS/backend.log" 2>&1 &
  BACKEND_PID=$!

  printf "  waiting for the API"
  local tries=0
  until curl -sf "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      printf "\n"
      warn "backend exited — last lines of logs/backend.log:"
      tail -20 "$LOGS/backend.log" | sed 's/^/    /'
      exit 1
    fi
    tries=$((tries + 1))
    if [ "$tries" -ge 90 ]; then
      printf "\n"
      die "API did not respond in time — see logs/backend.log"
    fi
    printf "."
    sleep 1
  done
  printf "\n"
  ok "API ready — tables created automatically on startup"
}

# ── frontend ─────────────────────────────────────────────────────
start_frontend() {
  step "Starting frontend on :$FRONTEND_PORT"

  if [ ! -d "$FRONTEND/node_modules" ]; then
    dim "installing npm dependencies (first run takes a few minutes)"
    (cd "$FRONTEND" && npm install --no-audit --no-fund >/dev/null 2>&1) \
      || die "npm install failed — run it manually in frontend/ to see why"
  fi

  if lsof -ti ":$FRONTEND_PORT" >/dev/null 2>&1; then
    die "port $FRONTEND_PORT is already in use — run ./dev.sh stop"
  fi

  (cd "$FRONTEND" && exec npm run dev) > "$LOGS/frontend.log" 2>&1 &
  FRONTEND_PID=$!

  printf "  waiting for Vite"
  local tries=0
  until curl -sf "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; do
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      printf "\n"
      warn "frontend exited — last lines of logs/frontend.log:"
      tail -20 "$LOGS/frontend.log" | sed 's/^/    /'
      exit 1
    fi
    tries=$((tries + 1))
    if [ "$tries" -ge 60 ]; then
      printf "\n"
      die "Vite did not respond in time — see logs/frontend.log"
    fi
    printf "."
    sleep 1
  done
  printf "\n"
  ok "frontend ready"
}

# ── lifecycle ────────────────────────────────────────────────────
cleanup() {
  trap - INT TERM EXIT
  printf "\n"
  step "Shutting down"
  [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  ok "app stopped (Postgres still running — ./dev.sh stop to shut it down)"
}

banner() {
  printf "\n"
  printf "  %sCampusConsult is running%s\n\n" "$C_GRN$C_BLD" "$C_RESET"
  printf "    App        %shttp://localhost:%s%s\n" "$C_BLD" "$FRONTEND_PORT" "$C_RESET"
  printf "    API docs   %shttp://localhost:%s/docs%s\n" "$C_BLD" "$BACKEND_PORT" "$C_RESET"
  printf "    Postgres   %slocalhost:%s%s\n" "$C_BLD" "$DB_HOST_PORT" "$C_RESET"
  printf "\n"
  dim "logs: logs/backend.log  logs/frontend.log     stop: Ctrl+C"
  printf "\n"
}

cmd_stop() {
  step "Stopping everything"
  for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    pids="$(lsof -ti ":$port" 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      echo "$pids" | xargs kill 2>/dev/null || true
      ok "freed port $port"
    fi
  done
  if [ -n "$DC" ] && docker info >/dev/null 2>&1; then
    (cd "$ROOT" && $DC stop db >/dev/null 2>&1) && ok "Postgres stopped"
  fi
}

cmd_reset_db() {
  printf "%sThis deletes ALL local database data.%s Type 'yes' to continue: " "$C_RED$C_BLD" "$C_RESET"
  read -r answer
  [ "$answer" = "yes" ] || { echo "Aborted."; exit 0; }
  step "Recreating the database volume"
  (cd "$ROOT" && $DC down -v >/dev/null 2>&1) || true
  ok "volume removed — run ./dev.sh to start fresh"
}

# ── main ─────────────────────────────────────────────────────────
case "${1:-all}" in
  stop)     cmd_stop; exit 0 ;;
  reset-db) preflight; cmd_reset_db; exit 0 ;;
  logs)     tail -f "$LOGS/backend.log" "$LOGS/frontend.log" ;;
  db)
    preflight; start_db; export_db_url
    ok "Postgres only — connect at localhost:$DB_HOST_PORT"
    exit 0
    ;;
  backend)
    preflight; start_db; export_db_url; setup_backend
    trap cleanup INT TERM EXIT
    start_backend
    printf "\n    API docs   http://localhost:%s/docs\n\n" "$BACKEND_PORT"
    wait
    ;;
  frontend)
    trap cleanup INT TERM EXIT
    start_frontend
    printf "\n    App        http://localhost:%s\n\n" "$FRONTEND_PORT"
    wait
    ;;
  all)
    preflight; start_db; export_db_url; setup_backend
    trap cleanup INT TERM EXIT
    start_backend
    start_frontend
    banner
    wait
    ;;
  *)
    sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
