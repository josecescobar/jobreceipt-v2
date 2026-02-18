export interface CashFlowPeriod {
  month: string;
  expectedInflows: number;
  expectedOutflows: number;
  netFlow: number;
  runningBalance: number;
}

export interface CashFlowForecast {
  periods: CashFlowPeriod[];
  currentBalance: number;
  summary: {
    totalExpectedIn: number;
    totalExpectedOut: number;
  };
}
