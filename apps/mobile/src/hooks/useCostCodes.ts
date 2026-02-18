import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costCodesApi } from '../api/cost-codes';
import type { CreateCostCodeInput, UpdateCostCodeInput } from '../api/cost-codes';
import { QUERY_STALE_TIME } from '../lib/constants';

export const costCodeKeys = {
  all: ['cost-codes'] as const,
  lists: () => [...costCodeKeys.all, 'list'] as const,
  list: () => [...costCodeKeys.lists()] as const,
  details: () => [...costCodeKeys.all, 'detail'] as const,
  detail: (id: string) => [...costCodeKeys.details(), id] as const,
};

export function useCostCodes() {
  return useQuery({
    queryKey: costCodeKeys.list(),
    queryFn: () => costCodesApi.list(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCostCode(id: string) {
  return useQuery({
    queryKey: costCodeKeys.detail(id),
    queryFn: () => costCodesApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateCostCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCostCodeInput) => costCodesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCodeKeys.lists() });
    },
  });
}

export function useUpdateCostCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateCostCodeInput }) =>
      costCodesApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(costCodeKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: costCodeKeys.lists() });
    },
  });
}

export function useDeleteCostCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => costCodesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCodeKeys.lists() });
    },
  });
}

export function useSeedDefaultCostCodes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => costCodesApi.seedDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCodeKeys.lists() });
    },
  });
}
