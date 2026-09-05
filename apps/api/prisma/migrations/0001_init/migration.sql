-- Initial baseline migration for JobReceipt Milestone 1
-- Generated manually to support greenfield bootstrap before prisma migrate generation.

CREATE TYPE "UserRole" AS ENUM ('OWNER', 'BOOKKEEPER', 'CREW');
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'CREW');
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "ReceiptStatus" AS ENUM ('PROCESSING', 'REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "CostCodeCategory" AS ENUM ('MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR', 'OVERHEAD');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "clerkId" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "phone" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'OWNER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "ownerId" TEXT NOT NULL,
  "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
  "stripeCustomerId" TEXT,
  "qbRealmId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Organization_ownerId_idx" ON "Organization" ("ownerId");

CREATE TABLE "OrganizationMember" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember" ("organizationId", "userId");
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember" ("organizationId");
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember" ("userId");

CREATE TABLE "Job" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "customerName" TEXT,
  "customerAddress" TEXT,
  "customerLat" DOUBLE PRECISION,
  "customerLng" DOUBLE PRECISION,
  "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
  "budgetTotalCents" INTEGER NOT NULL DEFAULT 0,
  "budgetMaterialsCents" INTEGER NOT NULL DEFAULT 0,
  "budgetLaborCents" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Job_organizationId_idx" ON "Job" ("organizationId");
CREATE INDEX "Job_organizationId_status_idx" ON "Job" ("organizationId", "status");

CREATE TABLE "CostCode" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "CostCodeCategory" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CostCode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CostCode_organizationId_code_key" ON "CostCode" ("organizationId", "code");
CREATE INDEX "CostCode_organizationId_idx" ON "CostCode" ("organizationId");

CREATE TABLE "Receipt" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "status" "ReceiptStatus" NOT NULL DEFAULT 'PROCESSING',
  "ocrRawJson" JSONB,
  "merchantName" TEXT,
  "merchantAddress" TEXT,
  "subtotalCents" INTEGER,
  "taxAmountCents" INTEGER,
  "totalAmountCents" INTEGER,
  "transactionDate" TIMESTAMP(3),
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "confidenceScore" INTEGER,
  "processedAt" TIMESTAMP(3),
  "suggestedJobId" TEXT,
  "suggestedScore" INTEGER,
  "suggestedReasons" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Receipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Receipt_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Receipt_suggestedJobId_fkey" FOREIGN KEY ("suggestedJobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Receipt_organizationId_idx" ON "Receipt" ("organizationId");
CREATE INDEX "Receipt_organizationId_status_idx" ON "Receipt" ("organizationId", "status");
CREATE INDEX "Receipt_organizationId_transactionDate_idx" ON "Receipt" ("organizationId", "transactionDate");

CREATE TABLE "ReceiptLineItem" (
  "id" TEXT PRIMARY KEY,
  "receiptId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sku" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitPriceCents" INTEGER NOT NULL,
  "totalPriceCents" INTEGER NOT NULL,
  "isConstructionMaterial" BOOLEAN NOT NULL DEFAULT false,
  "materialCategory" TEXT,
  "costCodeId" TEXT,
  "jobId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReceiptLineItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReceiptLineItem_costCodeId_fkey" FOREIGN KEY ("costCodeId") REFERENCES "CostCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ReceiptLineItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ReceiptLineItem_receiptId_idx" ON "ReceiptLineItem" ("receiptId");
CREATE INDEX "ReceiptLineItem_jobId_idx" ON "ReceiptLineItem" ("jobId");
CREATE INDEX "ReceiptLineItem_costCodeId_idx" ON "ReceiptLineItem" ("costCodeId");

CREATE TABLE "Expense" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "receiptId" TEXT,
  "jobId" TEXT NOT NULL,
  "costCodeId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT,
  "taxCategory" TEXT,
  "mileageMiles" DOUBLE PRECISION,
  "date" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Expense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Expense_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Expense_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Expense_costCodeId_fkey" FOREIGN KEY ("costCodeId") REFERENCES "CostCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Expense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Expense_organizationId_idx" ON "Expense" ("organizationId");
CREATE INDEX "Expense_organizationId_jobId_idx" ON "Expense" ("organizationId", "jobId");
CREATE INDEX "Expense_date_idx" ON "Expense" ("date");

CREATE TABLE "BudgetSnapshot" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "totalBudgetCents" INTEGER NOT NULL,
  "totalSpentCents" INTEGER NOT NULL,
  "totalRemainingCents" INTEGER NOT NULL,
  "materialsBudgetCents" INTEGER NOT NULL,
  "materialsSpentCents" INTEGER NOT NULL,
  "laborBudgetCents" INTEGER NOT NULL,
  "laborSpentCents" INTEGER NOT NULL,
  "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BudgetSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "BudgetSnapshot_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "BudgetSnapshot_organizationId_idx" ON "BudgetSnapshot" ("organizationId");
CREATE INDEX "BudgetSnapshot_jobId_snapshotDate_idx" ON "BudgetSnapshot" ("jobId", "snapshotDate");

CREATE TABLE "MileageTrip" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "jobId" TEXT,
  "userId" TEXT NOT NULL,
  "startLat" DOUBLE PRECISION,
  "startLng" DOUBLE PRECISION,
  "endLat" DOUBLE PRECISION,
  "endLng" DOUBLE PRECISION,
  "distanceMiles" DOUBLE PRECISION NOT NULL,
  "irsRateCents" INTEGER NOT NULL DEFAULT 70,
  "totalDeductionCents" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "purpose" TEXT,
  CONSTRAINT "MileageTrip_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MileageTrip_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MileageTrip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "MileageTrip_organizationId_idx" ON "MileageTrip" ("organizationId");
CREATE INDEX "MileageTrip_organizationId_date_idx" ON "MileageTrip" ("organizationId", "date");

CREATE TABLE "QuickBooksConnection" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL UNIQUE,
  "realmId" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuickBooksConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SyncLog" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "qbId" TEXT,
  "syncDirection" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "errorMessage" TEXT,
  "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SyncLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "SyncLog_organizationId_idx" ON "SyncLog" ("organizationId");
CREATE INDEX "SyncLog_entityType_entityId_idx" ON "SyncLog" ("entityType", "entityId");
