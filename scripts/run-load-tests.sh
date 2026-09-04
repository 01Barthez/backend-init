#!/usr/bin/env bash
# Raise rate limits, run k6 suite, restore compose defaults.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE=(docker compose -f "$ROOT/infra/docker/docker-compose.yml")
K6="${K6_BIN:-k6}"
BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
CACHE_NAME="${REDIS_CONTAINER:-BACKEND_CACHE}"

if ! command -v "$K6" >/dev/null 2>&1; then
  if [[ -x /snap/bin/k6 ]]; then K6=/snap/bin/k6; else
    echo "k6 not found. Install k6 or set K6_BIN." >&2
    exit 1
  fi
fi

clear_rate_limits() {
  docker exec "$CACHE_NAME" sh -c \
    "redis-cli --scan --pattern 'rl:*' | while read -r k; do [ -n \"\$k\" ] && redis-cli DEL \"\$k\" >/dev/null; done; true" \
    2>/dev/null || true
}

echo "==> Waiting for $BASE_URL/health"
for i in $(seq 1 30); do
  if curl -fsS "$BASE_URL/health" >/dev/null; then break; fi
  sleep 1
  if [[ $i -eq 30 ]]; then echo "API not ready" >&2; exit 1; fi
done

echo "==> Recreate backend with elevated rate limits for capacity run"
MAX_GLOBAL_QUERY_NUMBER=100000 MAX_UNIQ_QUERY_NUMBER=100000 MAX_AUTH_QUERY_NUMBER=20000 \
MINIO_LOGS_BUCKET="${MINIO_LOGS_BUCKET:-logs-archive}" \
  "${COMPOSE[@]}" up -d --force-recreate --no-deps backend

echo "==> Wait for healthy backend"
for i in $(seq 1 60); do
  if curl -fsS "$BASE_URL/health" >/dev/null; then break; fi
  sleep 2
  if [[ $i -eq 60 ]]; then echo "backend failed to come up" >&2; exit 1; fi
done

# Optional token for auth scenarios
TOKEN="${ACCESS_TOKEN:-}"
if [[ -z "$TOKEN" && -f /tmp/be-load-token ]]; then
  TOKEN="$(cat /tmp/be-load-token)"
fi

clear_rate_limits
echo "==> k6 01-public-health"
"$K6" run -e "BASE_URL=$BASE_URL" "$ROOT/tests/load/k6/scenarios/01-public-health.js"

clear_rate_limits
if [[ -n "$TOKEN" ]]; then
  echo "==> k6 02-auth-session"
  "$K6" run -e "BASE_URL=$BASE_URL" -e "ACCESS_TOKEN=$TOKEN" "$ROOT/tests/load/k6/scenarios/02-auth-session.js"
  clear_rate_limits
  echo "==> k6 03-mixed-workload"
  "$K6" run -e "BASE_URL=$BASE_URL" -e "ACCESS_TOKEN=$TOKEN" -e "MAX_VUS=${MAX_VUS:-100}" \
    "$ROOT/tests/load/k6/scenarios/03-mixed-workload.js"
else
  echo "==> skip 02-auth-session (set ACCESS_TOKEN or /tmp/be-load-token)"
  echo "==> k6 03-mixed-workload (public/signup only)"
  "$K6" run -e "BASE_URL=$BASE_URL" -e "MAX_VUS=${MAX_VUS:-80}" \
    "$ROOT/tests/load/k6/scenarios/03-mixed-workload.js"
fi

echo "==> Restore backend with .env rate limits"
unset MAX_GLOBAL_QUERY_NUMBER MAX_UNIQ_QUERY_NUMBER MAX_AUTH_QUERY_NUMBER || true
"${COMPOSE[@]}" up -d --force-recreate --no-deps backend

echo "==> Load suite finished"
