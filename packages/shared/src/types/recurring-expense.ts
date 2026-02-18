export type RecurringExpenseFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface RecurringExpense {
  id: string;
  organizationId: string;
  jobId: string;
  costCodeId: string | null;
  amount: number;
  description: string;
  category: string | null;
  taxCategory: string | null;
  frequency: RecurringExpenseFrequency;
  isActive: boolean;
  nextOccurrence: string;
  lastCreatedAt: string | null;
  startDate: string;
  endDate: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string };
  costCode?: { id: string; code: string; name: string } | null;
}
