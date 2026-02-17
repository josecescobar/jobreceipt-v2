#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/apps/api && npx prisma migrate deploy

echo "Starting API server..."
cd /app && node apps/api/dist/main
