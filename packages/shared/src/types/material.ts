export interface MaterialItem {
  id: string;
  organizationId: string;
  jobId: string;
  name: string;
  sku?: string | null;
  unit: string;
  unitCost: number;
  category?: string | null;
  costCodeId?: string | null;
  purchasedQty: number;
  usedQty: number;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string } | null;
  costCode?: { id: string; code: string; name: string } | null;
  createdBy?: { id: string; name: string | null } | null;
  usageLogs?: MaterialUsageLog[];
  _count?: { usageLogs: number };
}

export interface MaterialUsageLog {
  id: string;
  materialItemId: string;
  jobId: string;
  qty: number;
  notes?: string | null;
  loggedById: string;
  loggedAt: string;
  loggedBy?: { id: string; name: string | null } | null;
}

export interface MaterialSummary {
  totalItems: number;
  totalValue: number;
  totalUsedValue: number;
  categories: {
    category: string;
    count: number;
    value: number;
  }[];
}
