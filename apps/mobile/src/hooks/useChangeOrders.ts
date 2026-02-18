import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { changeOrdersApi } from '../api/change-orders';
import { QUERY_STALE_TIME } from '../lib/constants';

export const changeOrderKeys = {
  all: ['changeOrders'] as const,
  lists: () => [...changeOrderKeys.all, 'list'] as const,
  list: (params: { jobId: string; status?: string }) =>
    [...changeOrderKeys.lists(), params] as const,
  details: () => [...changeOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...changeOrderKeys.details(), id] as const,
};

export function useChangeOrders(params: { jobId: string; status?: string }) {
  return useQuery({
    queryKey: changeOrderKeys.list(params),
    queryFn: () => changeOrdersApi.list({ ...params, limit: 100 }),
    enabled: !!params.jobId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useChangeOrder(id: string) {
  return useQuery({
    queryKey: changeOrderKeys.detail(id),
    queryFn: () => changeOrdersApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateChangeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changeOrdersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: changeOrderKeys.lists() });
    },
  });
}

export function useUpdateChangeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof changeOrdersApi.update>[1] }) =>
      changeOrdersApi.update(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(changeOrderKeys.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: changeOrderKeys.lists() });
    },
  });
}

export function useDeleteChangeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => changeOrdersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: changeOrderKeys.lists() });
    },
  });
}

export function useApproveChangeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => changeOrdersApi.approve(id),
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(changeOrderKeys.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: changeOrderKeys.lists() });
      // Also invalidate jobs since budget/contract value changes
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useRejectChangeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => changeOrdersApi.reject(id),
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(changeOrderKeys.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: changeOrderKeys.lists() });
    },
  });
}
