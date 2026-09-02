#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../docker"

clear
echo "Stopping main services..."
cd "$COMPOSE_DIR"
docker compose down -v
echo "Main services stopped"
