#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npm run migrate

echo "✅ Migrations completed"
echo "🚀 Starting application..."
exec "$@"
