#!/bin/bash

echo "🛑 Arrêt des services de monitoring..."

docker compose -f docker-compose.monitoring.yml down -v

echo "✅ Services de monitoring arrêtés"
