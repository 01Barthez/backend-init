#!/bin/bash
# Arrête tout proprement (d'abord monitoring, puis application)

echo "🧹 Nettoyage complet..."

# Arrête d'abord le monitoring
./scripts/stop_monitoring.sh

# Puis l'application
./scripts/stop_app.sh

echo "✅ Tout est arrêté et nettoyé"
