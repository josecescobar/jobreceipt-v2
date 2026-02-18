export type EstimateStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export interface EstimateLineItem {
  id: string;
  estimateId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Estimate {
  id: string;
  organizationId: string;
  jobId: string;
  estimateNumber: string;
  status: EstimateStatus;
  issueDate: string;
  expiresAt: string | null;
  notes: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  convertedInvoiceId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string; customerName: string | null; customerAddress: string | null };
  lineItems?: EstimateLineItem[];
}
