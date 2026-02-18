#!/bin/bash

SERVICE=${1:-backend}

echo "🐚 Opening shell in $SERVICE container..."
docker-compose exec $SERVICE sh
