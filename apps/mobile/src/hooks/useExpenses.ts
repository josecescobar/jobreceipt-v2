import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { expensesApi } from '../api/expenses';
import type { ExpenseQueryDto, CreateExpenseDto, UpdateExpenseDto } from '@jobreceipt/shared';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';
import { jobKeys } from './useJobs';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (params: ExpenseQueryDto) => [...expenseKeys.lists(), params] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
};

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
