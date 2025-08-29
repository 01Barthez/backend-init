#!/bin/bash

echo "🛑 Stopping main services..."

docker compose down -v

echo "✅ Main services stopped"
