#!/bin/bash

echo "=== État des services principaux ==="
docker compose ps

echo -e "\n=== État des services de monitoring ==="
docker compose -f docker-compose.monitoring.yml ps 2>/dev/null || echo "Les services de monitoring ne sont pas démarrés"

echo -e "\n=== Logs récents du backend ==="
docker compose logs --tail=3 backend 2>/dev/null || echo "Backend non démarré"
