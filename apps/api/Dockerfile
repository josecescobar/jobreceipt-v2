# ── Stage 1: Build ──────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json ./

# Copy workspace package.json files (for npm ci)
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install all dependencies (workspace-aware)
RUN npm ci

# Copy shared package source and build it
COPY packages/shared/ packages/shared/
RUN cd packages/shared && npm run build

# Copy API source + Prisma schema
COPY apps/api/ apps/api/

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build NestJS API
RUN cd apps/api && npx nest build

# ── Stage 2: Production ────────────────────────────────
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy node_modules (includes workspace symlinks)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy built shared package
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy Prisma schema (needed for migrate deploy)
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Copy startup script
COPY apps/api/start.sh ./apps/api/start.sh
RUN chmod +x ./apps/api/start.sh

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "apps/api/start.sh"]
