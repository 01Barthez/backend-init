#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../docker"

clear
echo "=== Main services status ==="
cd "$COMPOSE_DIR"
docker compose ps

echo -e "\n=== Monitoring services status ==="
docker compose -f docker-compose.monitoring.yml ps 2>/dev/null || echo "Monitoring services are not running"

echo -e "\n=== Recent backend logs ==="
docker compose logs --tail=3 backend 2>/dev/null || echo "Backend is not running"
