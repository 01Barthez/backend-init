#!/bin/sh
set -e

echo "[INFO] Starting ClamAV initialization..."

# Vérifier si le socket existe déjà
if [ -S "/var/run/clamav/clamd.ctl" ]; then
    echo "[INFO] ClamAV socket already exists, skipping initialization"
    exit 0
fi

# Attendre que le socket soit disponible
MAX_RETRIES=30
RETRY_COUNT=0
SOCKET_PATH="/var/run/clamav/clamd.ctl"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if [ -S "$SOCKET_PATH" ]; then
        echo "[SUCCESS] ClamAV socket is ready!"
        exit 0
    fi
    
    echo "[INFO] Waiting for ClamAV socket... (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

echo "[ERROR] ClamAV socket not found after $MAX_RETRIES attempts"
exit 1
