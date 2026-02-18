export type PnlPeriod = 'month' | 'quarter' | 'year' | 'custom';

export interface PnlLineItem {
  category: string;
  /** In cents */
  amount: number;
  percentage: number;
}

export interface PnlJobBreakdown {
  jobId: string;
  jobName: string;
  /** In cents */
  amount: number;
}

export interface PnlReport {
  period: {
    start: string;
    end: string;
    label: string;
  };
  income: {
    /** In cents */
    invoicePayments: number;
    /** In cents */
    total: number;
    byJob: PnlJobBreakdown[];
  };
  expenses: {
    /** In cents */
    total: number;
    byCategory: PnlLineItem[];
    byJob: PnlJobBreakdown[];
  };
  /** In cents */
  mileageDeductions: number;
  /** In cents */
  netProfit: number;
  /** Percentage */
  profitMargin: number;
  comparison?: {
    /** In cents */
    previousNetProfit: number;
    changePercent: number;
  };
}
