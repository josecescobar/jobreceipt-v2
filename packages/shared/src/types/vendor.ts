export interface Vendor {
  id: string;
  organizationId: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  defaultCategory: string | null;
  defaultCostCodeId: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  defaultCostCode?: { id: string; code: string; name: string } | null;
}

export interface VendorSpending {
  totalSpent: number;
  receiptCount: number;
}
