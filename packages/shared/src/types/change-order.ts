export type ChangeOrderStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface ChangeOrderLineItem {
  id: string;
  changeOrderId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  costCodeId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrder {
  id: string;
  organizationId: string;
  jobId: string;
  changeOrderNumber: string;
  status: ChangeOrderStatus;
  title: string;
  description: string | null;
  reason: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  approvedById: string | null;
  approvedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string };
  lineItems?: ChangeOrderLineItem[];
  approvedBy?: { id: string; name: string | null };
}
