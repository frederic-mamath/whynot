#!/bin/bash
set -e

echo "🚀 Starting WhyNot development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Build and start services
docker-compose up --build

# Cleanup on exit
trap 'docker-compose down' EXIT
