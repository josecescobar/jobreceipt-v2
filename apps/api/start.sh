#!/bin/sh
set -e

echo "Applying database schema..."
cd /app/apps/api && npx prisma migrate deploy

echo "Starting API server..."
cd /app && node apps/api/dist/main
