#!/bin/bash
# Starts only the main services (backend, mongo, redis, etc.)

set -e  # Stop the script in case of error

clear

# Then the application
./scripts/stop_app.sh

echo "Starting the main application..."

# Check that Docker is running
if ! docker info &> /dev/null; then
  echo "❌Error: Docker is not running. Start it with 'sudo systemctl start docker'"
  exit 1
fi

# Start the main services
docker compose up -d --build

# Check that the critical services have started correctly
for service in backend mongo redis minio; do
  if ! docker compose ps | grep -q "$service.*Up"; then
    echo "❌ Error: The service $service did not start correctly"
    docker compose logs $service
    exit 1
  fi
done

echo "Main application started successfully"
echo "   - Backend:       http://localhost:3000"
echo "   - MongoDB:       mongodb://localhost:27017"
echo "   - Redis:         redis://localhost:6379"
echo "   - Minio:         http://localhost:9001"
echo "   - Mailhog:       http://localhost:8025"
