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

export interface TopMerchant {
  merchantName: string;
  /** In cents */
  totalSpent: number;
  receiptCount: number;
  /** 0-100 */
  percentage: number;
}

export interface PeriodComparison {
  /** In cents */
  totalExpensesPrevious: number;
  /** Percentage change, null if no previous data */
  expensesDelta: number | null;
  /** In cents */
  totalMileageDeductionsPrevious: number;
  mileageDelta: number | null;
  receiptCountPrevious: number;
  receiptsDelta: number | null;
}

export interface BudgetHealthJob {
  jobId: string;
  jobName: string;
  /** In cents */
  budgetTotal: number;
  /** In cents */
  totalSpent: number;
  /** 0-1+ (can exceed 1 if over budget) */
  utilizationRatio: number;
  status: 'good' | 'warning' | 'over';
}

export interface BudgetHealthOverview {
  /** In cents */
  totalBudget: number;
  /** In cents */
  totalSpent: number;
  healthyCount: number;
  warningCount: number;
  overBudgetCount: number;
  /** Sorted by utilization descending */
  jobs: BudgetHealthJob[];
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  totals: AnalyticsTotals;
  monthlySpending: MonthlySpending[];
  categoryBreakdown: CategoryBreakdown[];
  topJobs: TopJob[];
  topMerchants?: TopMerchant[];
  periodComparison?: PeriodComparison;
  budgetHealth?: BudgetHealthOverview;
}

export interface TaxCategoryTotal {
  taxCategory: string;
  /** e.g., "Line 22" */
  scheduleLine: string;
  /** e.g., "Supplies" */
  name: string;
  /** In cents */
  total: number;
  count: number;
}

export interface TaxSummary {
  year: number;
  taxCategoryBreakdown: TaxCategoryTotal[];
  mileage: {
    totalMiles: number;
    ratePerMile: number;
    /** In cents */
    totalDeduction: number;
  };
  totals: {
    /** In cents */
    totalExpenseDeductions: number;
    /** In cents */
    totalMileageDeductions: number;
    /** In cents */
    grandTotal: number;
    /** In cents — estimated savings from SE tax deduction */
    estimatedSETaxSavings: number;
  };
}
