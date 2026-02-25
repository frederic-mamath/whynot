#!/bin/bash
set -e

echo "🛑 Stopping WhyNot services..."

docker-compose stop

echo "✅ All services stopped"
