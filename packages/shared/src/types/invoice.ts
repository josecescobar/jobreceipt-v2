export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID';

export type InvoicePaymentMethod = 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'OTHER';

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  /** In cents */
  amount: number;
  date: string;
  method: InvoicePaymentMethod;
  note: string | null;
  createdAt: string;
}

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
  /** In cents — denormalized sum of all payments */
  paidAmount: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string; customerName: string | null; customerAddress: string | null };
  lineItems?: InvoiceLineItem[];
  payments?: InvoicePayment[];
}
