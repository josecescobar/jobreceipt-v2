export interface AgingInvoice {
  id: string;
  invoiceNumber: string;
  jobName: string;
  customerName: string | null;
  total: number;
  paidAmount: number;
  outstanding: number;
  dueDate: string;
  daysOverdue: number;
}

export interface AgingBucket {
  range: string;
  count: number;
  totalOutstanding: number;
  invoices: AgingInvoice[];
}

export interface AgingSummary {
  totalOverdue: number;
  totalOutstanding: number;
  overdueCount: number;
  buckets: AgingBucket[];
}
