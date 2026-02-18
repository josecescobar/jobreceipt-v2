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
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: expenseKeys.lists() });
      const listKey = expenseKeys.list({});
      const previous = queryClient.getQueryData(listKey);
      queryClient.setQueryData(listKey, (old: any) => {
        if (!old?.pages?.[0]) return old;
        const optimistic = {
          id: `__optimistic_${Date.now()}`,
          ...newExpense,
          amount: newExpense.amount ?? 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __optimistic: true,
        };
        return {
          ...old,
          pages: [
            { ...old.pages[0], data: [optimistic, ...old.pages[0].data] },
            ...old.pages.slice(1),
          ],
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(expenseKeys.list({}), context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      if (data.jobId) {
        queryClient.invalidateQueries({ queryKey: jobKeys.budget(data.jobId) });
      }
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

export function useBatchApproveExpenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => expensesApi.batchApprove(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}

export function useBatchRejectExpenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => expensesApi.batchReject(ids),
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
