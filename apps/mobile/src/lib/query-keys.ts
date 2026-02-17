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
