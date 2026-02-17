#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma

echo "Starting API server..."
node apps/api/dist/main
