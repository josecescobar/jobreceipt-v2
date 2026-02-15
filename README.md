# JobReceipt

Receipt scanning, expense tracking, and job costing for contractors.

## Architecture

Turborepo monorepo with three packages:

```
apps/
  api/       → NestJS backend (Prisma, BullMQ, Claude Vision OCR)
  mobile/    → React Native Expo app (SDK 52, expo-router)
packages/
  shared/    → Types, constants, Zod validators
```

## Tech Stack

**Backend:** NestJS, Prisma, PostgreSQL, BullMQ (Redis), Claude Vision for OCR

**Mobile:** React Native, Expo SDK 52, expo-router, TanStack Query, Zustand, WatermelonDB (offline sync)

**Auth:** Clerk

**Infra:** Turborepo, TypeScript, npm workspaces

## Features

- Camera-based receipt capture with HEIC→JPEG processing
- AI-powered OCR with line-item extraction and tax categorization
- Job costing with budget tracking and category breakdowns
- Expense management with Schedule C tax category mapping
- GPS mileage tracking with IRS rate calculations
- Offline-first with WatermelonDB sync engine
- Multi-tenant via Clerk organizations

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL
- Redis

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env

# Run database migrations
npx turbo run db:migrate --filter=api

# Start all apps in development
npx turbo dev
```

### Run a specific app

```bash
# API only
npx turbo dev --filter=api

# Mobile only
npx turbo dev --filter=mobile
```

### Run tests

```bash
npx turbo test
```

## Project Structure

| Path | Description |
|------|-------------|
| `apps/api/prisma/schema.prisma` | Database schema (14 models, 9 enums) |
| `apps/api/src/queue/receipt-ocr.processor.ts` | OCR processing pipeline |
| `apps/api/src/modules/receipts/job-suggestion.service.ts` | Job matching algorithm |
| `apps/mobile/app/` | Expo Router file-based screens |
| `apps/mobile/src/db/sync/engine.ts` | Offline sync engine |
| `packages/shared/src/constants/tax-categories.ts` | Schedule C category mapping |

## License

Private
