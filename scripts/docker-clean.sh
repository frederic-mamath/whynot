#!/bin/bash
set -e

echo "🧹 Cleaning Docker resources..."

# Stop and remove containers
docker-compose down

# Optionally remove volumes (pass --volumes flag)
if [ "$1" = "--volumes" ] || [ "$1" = "-v" ]; then
  echo "⚠️  Removing volumes (database data will be deleted)..."
  docker-compose down -v
fi

# Remove dangling images
docker image prune -f

echo "✅ Cleanup completed"
