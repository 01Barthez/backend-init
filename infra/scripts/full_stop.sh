#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Full cleanup..."

"$SCRIPT_DIR/stop_monitoring.sh"
"$SCRIPT_DIR/stop_app.sh"

echo "Everything is stopped and cleaned up"
