#!/bin/sh
set -e

echo "Applying database schema..."
cd /app/apps/api && npx prisma db push --skip-generate

echo "Starting API server..."
cd /app && node apps/api/dist/main
