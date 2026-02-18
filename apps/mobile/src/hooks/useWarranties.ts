import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  warrantyApi,
  type CreateWarrantyInput,
  type UpdateWarrantyInput,
  type WarrantyQueryParams,
  type CreateWarrantyClaimInput,
} from '../api/warranties';
import { QUERY_STALE_TIME } from '../lib/constants';

export const warrantyKeys = {
  all: ['warranties'] as const,
  lists: () => [...warrantyKeys.all, 'list'] as const,
  list: (params?: WarrantyQueryParams) =>
    [...warrantyKeys.lists(), params] as const,
  details: () => [...warrantyKeys.all, 'detail'] as const,
  detail: (id: string) => [...warrantyKeys.details(), id] as const,
  summary: () => [...warrantyKeys.all, 'summary'] as const,
  upcoming: () => [...warrantyKeys.all, 'upcoming'] as const,
};

export function useWarrantyList(params?: WarrantyQueryParams) {
  return useQuery({
    queryKey: warrantyKeys.list(params),
    queryFn: () => warrantyApi.list(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useWarranty(id: string) {
  return useQuery({
    queryKey: warrantyKeys.detail(id),
    queryFn: () => warrantyApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useWarrantySummary() {
  return useQuery({
    queryKey: warrantyKeys.summary(),
    queryFn: () => warrantyApi.getSummary(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUpcomingExpirations() {
  return useQuery({
    queryKey: warrantyKeys.upcoming(),
    queryFn: () => warrantyApi.getUpcomingExpirations(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWarrantyInput) => warrantyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warrantyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warrantyKeys.summary() });
      queryClient.invalidateQueries({ queryKey: warrantyKeys.upcoming() });
    },
  });
}

export function useUpdateWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateWarrantyInput;
    }) => warrantyApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(warrantyKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: warrantyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warrantyKeys.summary() });
      queryClient.invalidateQueries({ queryKey: warrantyKeys.upcoming() });
    },
  });
}

export function useDeleteWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warrantyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warrantyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warrantyKeys.summary() });
      queryClient.invalidateQueries({ queryKey: warrantyKeys.upcoming() });
    },
  });
}

export function useAddWarrantyClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      warrantyId,
      data,
    }: {
      warrantyId: string;
      data: CreateWarrantyClaimInput;
    }) => warrantyApi.addClaim(warrantyId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: warrantyKeys.detail(variables.warrantyId),
      });
      queryClient.invalidateQueries({ queryKey: warrantyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warrantyKeys.summary() });
    },
  });
}
