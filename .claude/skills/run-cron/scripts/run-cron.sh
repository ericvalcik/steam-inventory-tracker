#!/usr/bin/env bash
# Invoke the inventory-snapshot cron route against a local dev server.
#
# Usage: run-cron.sh [--dry] [--force]
#
# Reuses an already-running dev server if it finds one (only one `next dev` can
# hold the .next/dev lock at a time); otherwise starts one and shuts it down on
# exit.
set -euo pipefail

ROUTE="/api/cron/inventory-snapshot"
QUERY=""
for arg in "$@"; do
  case "$arg" in
    --dry)   QUERY="${QUERY}${QUERY:+&}dry=true" ;;
    --force) QUERY="${QUERY}${QUERY:+&}force=true" ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

[ -f .env.local ] || { echo "no .env.local in $ROOT" >&2; exit 1; }
CRON_SECRET="$(grep -E '^CRON_SECRET=' .env.local | head -1 | cut -d= -f2- | tr -d '"'"'"' \r')"
[ -n "$CRON_SECRET" ] || { echo "CRON_SECRET missing from .env.local" >&2; exit 1; }

# A 401 (not just any response) proves it's this app: the route's auth check ran.
find_port() {
  for port in $(seq 3000 3010); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
      "http://localhost:$port$ROUTE" 2>/dev/null || true)"
    [ "$code" = "401" ] && { echo "$port"; return 0; }
  done
  return 1
}

STARTED_PID=""
cleanup() { [ -n "$STARTED_PID" ] && kill "$STARTED_PID" 2>/dev/null || true; }
trap cleanup EXIT

if PORT="$(find_port)"; then
  echo "[run-cron] reusing dev server on port $PORT" >&2
else
  echo "[run-cron] no dev server found, starting one..." >&2
  LOG="$(mktemp -t run-cron-dev)"
  pnpm dev >"$LOG" 2>&1 &
  STARTED_PID=$!
  for _ in $(seq 1 60); do
    sleep 1
    PORT="$(find_port)" && break
    kill -0 "$STARTED_PID" 2>/dev/null || { echo "[run-cron] dev server died:" >&2; cat "$LOG" >&2; exit 1; }
  done
  [ -n "${PORT:-}" ] || { echo "[run-cron] dev server never came up:" >&2; cat "$LOG" >&2; exit 1; }
  echo "[run-cron] started dev server on port $PORT" >&2
fi

URL="http://localhost:$PORT$ROUTE${QUERY:+?$QUERY}"
echo "[run-cron] GET $URL" >&2
curl -sS -w '\nHTTP %{http_code}\n' -H "Authorization: Bearer $CRON_SECRET" "$URL"
