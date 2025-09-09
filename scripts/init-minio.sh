#!/bin/sh
set -e

if [ -z "$MINIO_ACCESS_KEY" ] || [ -z "$MINIO_SECRET_KEY" ] || [ -z "$MINIO_APP_BUCKET" ]; then
  echo "Erreur: Variables d'environnement manquantes"
  exit 1
fi

echo "En attente que MinIO soit prêt..."
until mc alias set minio http://minio:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY >/dev/null 2>&1; do 
  echo '...waiting for MinIO...' 
  sleep 1 
done

echo "Création du bucket $MINIO_APP_BUCKET..."
mc mb -p minio/${MINIO_APP_BUCKET} || true

echo "Configuration de la politique publique..."
mc anonymous set download minio/${MINIO_APP_BUCKET}

echo "✅ MinIO initialisé avec succès (bucket: ${MINIO_APP_BUCKET}, accès public activé)"
