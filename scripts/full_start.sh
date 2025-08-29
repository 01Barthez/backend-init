#!/bin/bash
# Master script that starts everything in the correct order:
# 1. Starts the application
# 2. Checks that everything is OK
# 3. Starts monitoring

echo "🎯 Full startup of the application and monitoring..."

# Step 1: Start the application
./scripts/start_app.sh
if [ $? -ne 0 ]; then
  echo "❌ Failed to start the application"
  exit 1
fi

# Wait 10 seconds for everything to stabilize
echo "⏳ Waiting 10 seconds for stabilization..."
sleep 10

# Step 2: Start monitoring
./scripts/start_monitoring.sh
if [ $? -ne 0 ]; then
  echo "❌ Failed to start monitoring"
  exit 1
fi

# Step 3: Show final status
./scripts/status.sh

echo -e "\n🎉 Everything started successfully!"
echo "   - Application: http://localhost:3000"
echo "   - Monitoring: http://localhost:3001 (Grafana)"
