# JobReceipt Monorepo

Milestone 1 implementation for JobReceipt "Snap & Store" backend foundation.

## Stack

- Turborepo workspaces
- NestJS API (`apps/api`)
- Prisma + PostgreSQL
- BullMQ + Redis
- AWS S3 pre-signed upload flow
- Anthropic OCR pipeline

## Quick Start

1. Copy API env file:
   - `cp apps/api/.env.example apps/api/.env`
2. Start local infra:
   - `docker compose up -d`
3. Install dependencies:
   - `npm install`
4. Generate Prisma client and apply migrations:
   - `npm --workspace @jobreceipt/api run prisma:generate`
   - `npm --workspace @jobreceipt/api run prisma:migrate:dev`
   - `npm --workspace @jobreceipt/api run prisma:seed`
5. Run API:
   - `npm --workspace @jobreceipt/api run dev`
6. Run worker:
   - `npm --workspace @jobreceipt/api run worker`

## API Docs

- Swagger UI: `http://localhost:3000/docs`
- Health: `http://localhost:3000/v1/health`
- Metrics: `http://localhost:3000/v1/health/metrics`

## Milestone 1 Endpoints

- `POST /v1/auth/webhook`
- `POST /v1/organizations`
- `POST /v1/organizations/:id/members/invite`
- `GET /v1/jobs`
- `POST /v1/jobs`
- `GET /v1/jobs/:id`
- `PATCH /v1/jobs/:id`
- `GET /v1/jobs/:id/budget`
- `POST /v1/receipts/upload`
- `POST /v1/receipts/:id/process`
- `GET /v1/receipts/:id`
- `GET /v1/receipts`
- `PATCH /v1/receipts/:id`
- `PATCH /v1/receipts/:id/split`
- `POST /v1/expenses`
- `GET /v1/expenses`

## Notes

- Money values are stored as integer cents.
- Tenant scope is enforced with `x-org-id` request header via Prisma middleware.
- Dead-letter queue is `receipt-ocr-dlq`.
