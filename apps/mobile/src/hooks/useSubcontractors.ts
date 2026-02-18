import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { subcontractorsApi } from '../api/subcontractors';
import type { CreateSubcontractorInput, UpdateSubcontractorInput, SubcontractorQuery } from '../api/subcontractors';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';

export const subcontractorKeys = {
  all: ['subcontractors'] as const,
  lists: () => [...subcontractorKeys.all, 'list'] as const,
  list: (params: SubcontractorQuery) => [...subcontractorKeys.lists(), params] as const,
  details: () => [...subcontractorKeys.all, 'detail'] as const,
  detail: (id: string) => [...subcontractorKeys.details(), id] as const,
  summary: (id: string) => [...subcontractorKeys.all, 'summary', id] as const,
};

export function useSubcontractors(params?: SubcontractorQuery) {
  return useInfiniteQuery({
    queryKey: subcontractorKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      subcontractorsApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useSubcontractor(id: string) {
  return useQuery({
    queryKey: subcontractorKeys.detail(id),
    queryFn: () => subcontractorsApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useSubcontractorSummary(id: string) {
  return useQuery({
    queryKey: subcontractorKeys.summary(id),
    queryFn: () => subcontractorsApi.getSummary(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateSubcontractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubcontractorInput) => subcontractorsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subcontractorKeys.lists() });
    },
  });
}

export function useUpdateSubcontractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateSubcontractorInput }) =>
      subcontractorsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(subcontractorKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: subcontractorKeys.lists() });
    },
  });
}

export function useDeleteSubcontractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subcontractorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subcontractorKeys.lists() });
    },
  });
}
