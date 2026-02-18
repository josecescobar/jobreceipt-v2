import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estimatesApi } from '../api/estimates';
import { invoiceKeys } from './useInvoices';
import { QUERY_STALE_TIME } from '../lib/constants';

export const estimateKeys = {
  all: ['estimates'] as const,
  lists: () => [...estimateKeys.all, 'list'] as const,
  list: (params: { jobId?: string; status?: string }) =>
    [...estimateKeys.lists(), params] as const,
  details: () => [...estimateKeys.all, 'detail'] as const,
  detail: (id: string) => [...estimateKeys.details(), id] as const,
};

export function useEstimates(params?: { jobId?: string; status?: string }) {
  return useQuery({
    queryKey: estimateKeys.list(params ?? {}),
    queryFn: () => estimatesApi.list({ ...params, limit: 100 }),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: estimateKeys.detail(id),
    queryFn: () => estimatesApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: estimatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
    },
  });
}

export function useUpdateEstimate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof estimatesApi.update>[1] }) =>
      estimatesApi.update(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(estimateKeys.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
    },
  });
}

export function useDeleteEstimate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => estimatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
    },
  });
}

export function useConvertEstimateToInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => estimatesApi.convertToInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: estimateKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
