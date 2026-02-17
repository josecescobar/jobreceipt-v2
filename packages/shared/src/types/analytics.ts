export interface AnalyticsPeriod {
  startDate: string;
  endDate: string;
}

export interface AnalyticsTotals {
  /** In cents */
  totalExpenses: number;
  /** In cents */
  totalMileageDeductions: number;
  receiptCount: number;
  expenseCount: number;
  tripCount: number;
}

export interface MonthlySpending {
  /** Format: "YYYY-MM" */
  month: string;
  /** In cents */
  total: number;
}

export interface CategoryBreakdown {
  category: string;
  /** In cents */
  total: number;
  count: number;
  /** 0-100 */
  percentage: number;
}

export interface TopJob {
  jobId: string;
  jobName: string;
  /** In cents */
  totalSpent: number;
  expenseCount: number;
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  totals: AnalyticsTotals;
  monthlySpending: MonthlySpending[];
  categoryBreakdown: CategoryBreakdown[];
  topJobs: TopJob[];
}
