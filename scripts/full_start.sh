#!/bin/bash
# Script maître qui lance tout dans le bon ordre:
# 1. Démarre l'application
# 2. Vérifie que tout est OK
# 3. Démarre le monitoring

echo "🎯 Démarrage complet de l'application et du monitoring..."

# Étape 1: Démarre l'application
./scripts/start_app.sh
if [ $? -ne 0 ]; then
  echo "❌ Échec du démarrage de l'application"
  exit 1
fi

# Attends 10 secondes pour que tout soit stable
echo "⏳ Attente de 10 secondes pour stabilisation..."
sleep 10

# Étape 2: Démarre le monitoring
./scripts/start_monitoring.sh
if [ $? -ne 0 ]; then
  echo "❌ Échec du démarrage du monitoring"
  exit 1
fi

# Étape 3: Affiche l'état final
./scripts/status.sh

echo -e "\n🎉 Tout est démarré avec succès !"
echo "   - Application: http://localhost:3000"
echo "   - Monitoring: http://localhost:3001 (Grafana)"
