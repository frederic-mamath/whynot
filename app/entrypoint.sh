#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx tsx migrate.ts

echo "🚀 Starting application..."
exec node dist/index.js
