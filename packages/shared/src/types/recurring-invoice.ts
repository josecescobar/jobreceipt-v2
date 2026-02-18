import type { RecurringExpenseFrequency } from './recurring-expense';

export interface RecurringInvoiceLineItem {
  id: string;
  recurringInvoiceId: string;
  description: string;
  quantity: number;
  /** In cents */
  unitPrice: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringInvoice {
  id: string;
  organizationId: string;
  jobId: string;
  isActive: boolean;
  frequency: RecurringExpenseFrequency;
  nextOccurrence: string;
  lastCreatedAt: string | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  taxRate: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string };
  lineItems?: RecurringInvoiceLineItem[];
}
