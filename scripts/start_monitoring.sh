#!/bin/bash

set -e

echo "Vérification que l'application principale est démarrée..."

# Vérifie que le backend est Up
if ! docker compose ps | grep -q "backend.*Up"; then
  echo "❌ Erreur: L'application principale (backend) n'est pas démarrée"
  echo "   Lance d'abord: ./scripts/start_app.sh"
  exit 1
fi

echo "Démarrage des services de monitoring..."

# Démarre les services de monitoring
docker compose -f docker-compose.monitoring.yml up -d

# Vérifie que les services de monitoring sont bien démarrés
for service in prometheus grafana loki; do
  if ! docker compose -f docker-compose.monitoring.yml ps | grep -q "$service.*Up"; then
    echo "❌ Erreur: Le service de monitoring $service n'a pas démarré correctement"
    docker compose -f docker-compose.monitoring.yml logs $service
    exit 1
  fi
done

echo "Monitoring démarré avec succès"
echo "   - Prometheus:    http://localhost:9090"
echo "   - Grafana:       http://localhost:3001 (admin/grafana)"
echo "   - Loki:          Intégré à Grafana"
echo "   - Alertmanager:  http://localhost:9093"
