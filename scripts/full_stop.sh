#!/bin/bash
# Stops everything cleanly (first monitoring, then application)

echo "🧹 Full cleanup..."

# First stop monitoring
./scripts/stop_monitoring.sh

# Then the application
./scripts/stop_app.sh

echo "✅ Everything is stopped and cleaned up"
