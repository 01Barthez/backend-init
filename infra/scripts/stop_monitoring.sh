#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../docker"

clear
echo "Stopping monitoring services..."
cd "$COMPOSE_DIR"
docker compose -f docker-compose.monitoring.yml down -v
echo "Monitoring services stopped"
