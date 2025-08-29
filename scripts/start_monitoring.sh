#!/bin/bash

set -e

clear

echo "Checking that the main application is started..."

# Check that the backend is Up
if ! docker compose ps | grep -q "backend.*Up"; then
  echo "❌ Error: The main application (backend) is not started"
  echo "   First run: ./scripts/start_app.sh"
  exit 1
fi

echo "Starting monitoring services..."

# Start monitoring services
docker compose -f docker-compose.monitoring.yml up -d

# Check that monitoring services are started
for service in prometheus grafana loki; do
  if ! docker compose -f docker-compose.monitoring.yml ps | grep -q "$service.*Up"; then
    echo "❌ Error: The monitoring service $service did not start correctly"
    docker compose -f docker-compose.monitoring.yml logs $service
    exit 1
  fi
done

echo "Monitoring started successfully"
echo "   - Prometheus:    http://localhost:9090"
echo "   - Grafana:       http://localhost:3001 (admin/grafana)"
echo "   - Loki:          Integrated with Grafana"
echo "   - Alertmanager:  http://localhost:9093"
