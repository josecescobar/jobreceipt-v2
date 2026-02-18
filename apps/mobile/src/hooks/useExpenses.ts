import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { expensesApi } from '../api/expenses';
import type { ExpenseQueryDto, CreateExpenseDto, UpdateExpenseDto } from '@jobreceipt/shared';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';
import { jobKeys } from './useJobs';
import { expenseKeys, receiptKeys } from '../lib/query-keys';

export { expenseKeys };

export function useExpenses(params?: ExpenseQueryDto) {
  return useInfiniteQuery({
    queryKey: expenseKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      expensesApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expensesApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expense: CreateExpenseDto) => expensesApi.create(expense),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      // Invalidate job budget if expense is linked to a job
      if (data.jobId) {
        queryClient.invalidateQueries({ queryKey: jobKeys.budget(data.jobId) });
      }
      // Invalidate receipt detail to show linked expense
      if (data.receiptId) {
        queryClient.invalidateQueries({ queryKey: receiptKeys.detail(data.receiptId) });
      }
    },
  });
}

export function useCreateExpenseBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: CreateExpenseDto[]) => expensesApi.createBatch(items),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      // Invalidate budgets for all affected jobs
      const jobIds = new Set(data.map((e) => e.jobId));
      for (const jobId of jobIds) {
        queryClient.invalidateQueries({ queryKey: jobKeys.budget(jobId) });
      }
      // Invalidate receipt detail if linked
      const receiptIds = new Set(data.map((e) => e.receiptId).filter(Boolean));
      for (const receiptId of receiptIds) {
        queryClient.invalidateQueries({ queryKey: receiptKeys.detail(receiptId!) });
      }
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateExpenseDto }) =>
      expensesApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(expenseKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      if (data.jobId) {
        queryClient.invalidateQueries({ queryKey: jobKeys.budget(data.jobId) });
      }
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}

export function useBatchDeleteExpenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => expensesApi.batchDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}

export function useBatchUpdateExpenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      updates,
    }: {
      ids: string[];
      updates: { jobId?: string; category?: string };
    }) => expensesApi.batchUpdate(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.approve(id),
    onSuccess: (data) => {
      queryClient.setQueryData(expenseKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}

export function useRejectExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}

export function usePendingExpenseCount() {
  return useExpenses({ status: 'pending', limit: 1 });
}
