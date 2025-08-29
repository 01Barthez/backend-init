#!/bin/bash

echo "🛑 Arrêt des services principaux..."

docker compose down -v

echo "✅ Services principaux arrêtés"
