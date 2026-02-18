import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  recurringInvoicesApi,
  type CreateRecurringInvoiceInput,
  type UpdateRecurringInvoiceInput,
  type RecurringInvoiceQuery,
} from '../api/recurring-invoices';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';

export const recurringInvoiceKeys = {
  all: ['recurring-invoices'] as const,
  lists: () => [...recurringInvoiceKeys.all, 'list'] as const,
  list: (params: RecurringInvoiceQuery) => [...recurringInvoiceKeys.lists(), params] as const,
  details: () => [...recurringInvoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurringInvoiceKeys.details(), id] as const,
};

export function useRecurringInvoices(params?: RecurringInvoiceQuery) {
  return useInfiniteQuery({
    queryKey: recurringInvoiceKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      recurringInvoicesApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useRecurringInvoice(id: string) {
  return useQuery({
    queryKey: recurringInvoiceKeys.detail(id),
    queryFn: () => recurringInvoicesApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringInvoiceInput) => recurringInvoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
    },
  });
}

export function useUpdateRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateRecurringInvoiceInput }) =>
      recurringInvoicesApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(recurringInvoiceKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
    },
  });
}

export function useDeleteRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringInvoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
    },
  });
}
