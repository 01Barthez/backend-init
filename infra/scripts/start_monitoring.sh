#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../docker"

clear

echo "Checking that the main application is started..."

cd "$COMPOSE_DIR"
if ! docker compose ps | grep -q "backend.*Up"; then
  echo "Error: The main application (backend) is not started"
  echo "First run: ./infra/scripts/start_app.sh"
  exit 1
fi

echo "Starting monitoring services..."
docker compose -f docker-compose.monitoring.yml up -d

for service in prometheus grafana loki; do
  if ! docker compose -f docker-compose.monitoring.yml ps | grep -q "$service.*Up"; then
    echo "Error: The monitoring service $service did not start correctly"
    docker compose -f docker-compose.monitoring.yml logs "$service"
    exit 1
  fi
done

echo "Monitoring started successfully"
