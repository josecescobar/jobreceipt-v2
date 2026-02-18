import type { ReceiptQueryDto, ExpenseQueryDto } from '@jobreceipt/shared';

export const receiptKeys = {
  all: ['receipts'] as const,
  lists: () => [...receiptKeys.all, 'list'] as const,
  list: (params: ReceiptQueryDto) => [...receiptKeys.lists(), params] as const,
  details: () => [...receiptKeys.all, 'detail'] as const,
  detail: (id: string) => [...receiptKeys.details(), id] as const,
  recent: () => [...receiptKeys.all, 'recent'] as const,
};

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (params: ExpenseQueryDto) => [...expenseKeys.lists(), params] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
};

export const analyticsKeys = {
  all: ['analytics'] as const,
  summaries: () => [...analyticsKeys.all, 'summary'] as const,
  summary: (params: { startDate?: string; endDate?: string }) =>
    [...analyticsKeys.summaries(), params] as const,
  taxSummaries: () => [...analyticsKeys.all, 'tax-summary'] as const,
  taxSummary: (year: number) =>
    [...analyticsKeys.taxSummaries(), year] as const,
  profitabilities: () => [...analyticsKeys.all, 'profitability'] as const,
  profitability: (params: { startDate?: string; endDate?: string }) =>
    [...analyticsKeys.profitabilities(), params] as const,
  weeklyComparison: () => [...analyticsKeys.all, 'weekly-comparison'] as const,
  cashFlow: () => [...analyticsKeys.all, 'cash-flow'] as const,
  cashFlowForecast: (months: number) => [...analyticsKeys.cashFlow(), months] as const,
};
