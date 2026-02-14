export interface BudgetSnapshot {
  id: string;
  jobId: string;
  /** All amounts in cents */
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  materialsBudget: number;
  materialsSpent: number;
  laborBudget: number;
  laborSpent: number;
  snapshotDate: Date;
  createdAt: Date;
}
