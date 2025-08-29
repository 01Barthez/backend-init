#!/bin/bash

clear

echo "🛑 Stopping monitoring services..."

docker compose -f docker-compose.monitoring.yml down -v

echo "✅ Monitoring services stopped"
