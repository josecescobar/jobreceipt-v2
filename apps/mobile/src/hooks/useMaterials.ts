import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  materialsApi,
  type CreateMaterialItemInput,
  type UpdateMaterialItemInput,
  type MaterialQueryParams,
} from '../api/materials';
import { QUERY_STALE_TIME } from '../lib/constants';

export const materialKeys = {
  all: ['materials'] as const,
  lists: () => [...materialKeys.all, 'list'] as const,
  byJob: (jobId: string) => [...materialKeys.lists(), jobId] as const,
  details: () => [...materialKeys.all, 'detail'] as const,
  detail: (id: string) => [...materialKeys.details(), id] as const,
  summaries: () => [...materialKeys.all, 'summary'] as const,
  jobSummary: (jobId: string) => [...materialKeys.summaries(), 'job', jobId] as const,
  inventorySummary: () => [...materialKeys.summaries(), 'inventory'] as const,
};

export function useMaterialItems(params?: MaterialQueryParams) {
  return useQuery({
    queryKey: [...materialKeys.lists(), params],
    queryFn: () => materialsApi.list(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useMaterialItem(id: string) {
  return useQuery({
    queryKey: materialKeys.detail(id),
    queryFn: () => materialsApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useJobMaterialSummary(jobId: string) {
  return useQuery({
    queryKey: materialKeys.jobSummary(jobId),
    queryFn: () => materialsApi.getJobSummary(jobId),
    enabled: !!jobId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: materialKeys.inventorySummary(),
    queryFn: () => materialsApi.getInventorySummary(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaterialItemInput) => materialsApi.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: materialKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: materialKeys.jobSummary(variables.jobId),
      });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      jobId: string;
      updates: UpdateMaterialItemInput;
    }) => materialsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(materialKeys.detail(variables.id), data);
      queryClient.invalidateQueries({
        queryKey: materialKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: materialKeys.jobSummary(variables.jobId),
      });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; jobId: string }) =>
      materialsApi.delete(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: materialKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: materialKeys.jobSummary(variables.jobId),
      });
    },
  });
}

export function useLogMaterialUsage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      materialItemId: string;
      qty: number;
      jobId?: string;
      notes?: string;
    }) => materialsApi.logUsage(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: materialKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: materialKeys.lists(),
      });
      if (variables.jobId) {
        queryClient.invalidateQueries({
          queryKey: materialKeys.jobSummary(variables.jobId),
        });
      }
      // Also invalidate all job summaries since we might not have the jobId
      queryClient.invalidateQueries({
        queryKey: materialKeys.summaries(),
      });
    },
  });
}
