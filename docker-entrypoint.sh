#!/bin/sh
set -e

# Run Prisma migrations if DATABASE_URL is set and we're starting the API
if [ "$RUN_MIGRATIONS" = "true" ] && [ -n "$DATABASE_URL" ]; then
  echo "Running Prisma migrations..."
  cd /app/apps/api && npx prisma migrate deploy
  cd /app
fi

exec "$@"
