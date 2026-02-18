export interface ExpenseTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  /** In cents */
  amount: number | null;
  category: string | null;
  taxCategory: string | null;
  costCodeId: string | null;
  merchantName: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  costCode?: { id: string; code: string; name: string } | null;
}
