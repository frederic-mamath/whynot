#!/bin/bash
set -e

echo "🔄 Running database migrations..."

if ! docker-compose ps | grep whynot-backend | grep -q "Up"; then
  echo "❌ Backend container is not running. Start it first with:"
  echo "   docker-compose up -d backend"
  exit 1
fi

docker-compose exec backend npm run migrate

echo "✅ Migrations completed"
