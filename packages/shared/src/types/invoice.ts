export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID';

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  expenseId: string | null;
  description: string;
  quantity: number;
  /** In cents */
  unitPrice: number;
  /** In cents */
  total: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  jobId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  /** In cents */
  subtotal: number;
  taxRate: number;
  /** In cents */
  taxAmount: number;
  /** In cents */
  total: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string; customerName: string | null; customerAddress: string | null };
  lineItems?: InvoiceLineItem[];
}
