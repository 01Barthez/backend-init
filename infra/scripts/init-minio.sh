#!/bin/sh
set -e

if [ -z "$MINIO_ACCESS_KEY" ] || [ -z "$MINIO_SECRET_KEY" ]; then
  echo "Error: MINIO_ACCESS_KEY / MINIO_SECRET_KEY missing"
  exit 1
fi

UPLOADS_BUCKET="${MINIO_APP_BUCKET:-app-uploads}"
BACKUPS_BUCKET="${MINIO_BACKUP_BUCKET:-backups}"

echo "Waiting for MinIO..."
until mc alias set minio http://minio:9000 "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null 2>&1; do
  echo '...waiting for MinIO...'
  sleep 1
done

for bucket in "$UPLOADS_BUCKET" "$BACKUPS_BUCKET"; do
  echo "Ensuring bucket: $bucket"
  mc mb -p "minio/${bucket}" || true
done

# Public read only for uploads (avatars, covers). Backups stay private.
mc anonymous set download "minio/${UPLOADS_BUCKET}" || true
mc anonymous set none "minio/${BACKUPS_BUCKET}" || true

echo "MinIO initialized (buckets: ${UPLOADS_BUCKET}, ${BACKUPS_BUCKET})"
