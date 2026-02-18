import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { recurringExpensesApi } from '../api/recurring-expenses';
import type { CreateRecurringExpenseDto, UpdateRecurringExpenseDto, RecurringExpenseQueryDto } from '@jobreceipt/shared';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';

export const recurringExpenseKeys = {
  all: ['recurring-expenses'] as const,
  lists: () => [...recurringExpenseKeys.all, 'list'] as const,
  list: (params: RecurringExpenseQueryDto) => [...recurringExpenseKeys.lists(), params] as const,
  details: () => [...recurringExpenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurringExpenseKeys.details(), id] as const,
};

export function useRecurringExpenses(params?: RecurringExpenseQueryDto) {
  return useInfiniteQuery({
    queryKey: recurringExpenseKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      recurringExpensesApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useRecurringExpense(id: string) {
  return useQuery({
    queryKey: recurringExpenseKeys.detail(id),
    queryFn: () => recurringExpensesApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringExpenseDto) => recurringExpensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() });
    },
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateRecurringExpenseDto }) =>
      recurringExpensesApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(recurringExpenseKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() });
    },
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringExpensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringExpenseKeys.lists() });
    },
  });
}
