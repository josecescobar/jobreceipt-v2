# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci

# Copy source
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/

# Generate Prisma client and build
RUN cd apps/api && npx prisma generate
RUN npx turbo run build

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci --omit=dev

# Copy Prisma schema and generate client for production
COPY apps/api/prisma/ apps/api/prisma/
RUN cd apps/api && npx prisma generate

# Copy built output
COPY --from=builder /app/apps/api/dist/ apps/api/dist/
COPY --from=builder /app/packages/shared/dist/ packages/shared/dist/

# Copy entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/apps/api/src/main.js"]
