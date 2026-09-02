#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../docker"

clear
"$SCRIPT_DIR/stop_app.sh"

echo "---------------------STARTING THE MAIN APPLICATION---------------------"

if ! docker info &> /dev/null; then
  echo "Error: Docker is not running."
  exit 1
fi

cd "$COMPOSE_DIR"
docker compose up -d --build

for service in backend mongo redis minio; do
  if ! docker compose ps | grep -q "$service.*Up"; then
    echo "Error: The service $service did not start correctly"
    docker compose logs "$service"
    exit 1
  fi
done

echo "---------------------MAIN APPLICATION SUCCESSFULLY LAUNCHED---------------------"
