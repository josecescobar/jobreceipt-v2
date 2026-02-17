#!/bin/sh
set -e

echo "=== Checking dist contents ==="
ls -la apps/api/dist/ || echo "dist/ directory not found!"

echo "Running database migrations..."
npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma

echo "Starting API server on PORT=${PORT}..."
node apps/api/dist/main
