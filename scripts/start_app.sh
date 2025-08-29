#!/bin/bash
# Démarre uniquement les services principaux (backend, mongo, redis, etc.)

set -e  # Arrête le script en cas d'erreur

echo "Démarrage de l'application principale..."

# Vérifie que Docker est en cours d'exécution
if ! docker info &> /dev/null; then
  echo "❌Erreur: Docker n'est pas démarré. Lance-le avec 'sudo systemctl start docker'"
  exit 1
fi

# Démarre les services principaux
docker compose up -d

# Vérifie que les services critiques sont bien démarrés
for service in backend mongo redis minio; do
  if ! docker compose ps | grep -q "$service.*Up"; then
    echo "❌ Erreur: Le service $service n'a pas démarré correctement"
    docker compose logs $service
    exit 1
  fi
done

echo "Application principale démarrée avec succès"
echo "   - Backend:       http://localhost:3000"
echo "   - MongoDB:       mongodb://localhost:27017"
echo "   - Redis:         redis://localhost:6379"
echo "   - Minio:         http://localhost:9001"
echo "   - Mailhog:       http://localhost:8025"
