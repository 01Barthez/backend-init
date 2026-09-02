#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Full startup of the application and monitoring..."

"$SCRIPT_DIR/start_app.sh" || exit 1

echo "Waiting 10 seconds for stabilization..."
sleep 10

"$SCRIPT_DIR/start_monitoring.sh" || exit 1

"$SCRIPT_DIR/status.sh"

echo "Everything started successfully"
