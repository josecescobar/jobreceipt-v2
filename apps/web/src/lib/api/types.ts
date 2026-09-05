export interface Receipt {
  id: string;
  organizationId: string;
  uploadedById: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  status: string;
  ocrRawJson: unknown;
  merchantName: string | null;
  merchantAddress: string | null;
  subtotalCents: number | null;
  taxAmountCents: number | null;
  totalAmountCents: number | null;
  transactionDate: string | null;
  currency: string;
  confidenceScore: number | null;
  processedAt: string | null;
  suggestedJobId: string | null;
  suggestedScore: number | null;
  suggestedReasons: unknown;
  createdAt: string;
  updatedAt: string;
  lineItems?: ReceiptLineItem[];
  expenses?: Expense[];
}

export interface ReceiptLineItem {
  id: string;
  receiptId: string;
  description: string;
  sku: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  isConstructionMaterial: boolean;
  materialCategory: string | null;
  costCodeId: string | null;
  jobId: string | null;
}

export interface Job {
  id: string;
  organizationId: string;
  name: string;
  customerName: string | null;
  customerAddress: string | null;
  status: string;
  budgetTotalCents: number;
  budgetMaterialsCents: number;
  budgetLaborCents: number;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  organizationId: string;
  receiptId: string | null;
  jobId: string;
  costCodeId: string | null;
  amountCents: number;
  description: string;
  category: string | null;
  taxCategory: string | null;
  mileageMiles: number | null;
  date: string;
  createdById: string;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  receiptId: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface ProcessResponse {
  queued: boolean;
  queueJobId: string;
}

export interface HealthResponse {
  status: string;
  database: string;
  redis: string;
  backlog: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  memberCount: number;
  createdAt: string;
}

export interface BudgetResponse {
  jobId: string;
  totalBudgetCents: number;
  totalSpentCents: number;
  totalRemainingCents: number;
  health: string;
  byCategory: { category: string | null; totalSpentCents: number }[];
}
