import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  punchListApi,
  type CreatePunchListItemInput,
  type UpdatePunchListItemInput,
  type PunchListQueryParams,
} from '../api/punch-lists';
import { QUERY_STALE_TIME } from '../lib/constants';

export const punchListKeys = {
  all: ['punch-lists'] as const,
  lists: () => [...punchListKeys.all, 'list'] as const,
  byJob: (jobId: string) => [...punchListKeys.lists(), jobId] as const,
  details: () => [...punchListKeys.all, 'detail'] as const,
  detail: (id: string) => [...punchListKeys.details(), id] as const,
  summaries: () => [...punchListKeys.all, 'summary'] as const,
  jobSummary: (jobId: string) => [...punchListKeys.summaries(), jobId] as const,
};

export function usePunchListItems(
  jobId: string,
  filters?: { status?: string; page?: number; limit?: number },
) {
  return useQuery({
    queryKey: [...punchListKeys.byJob(jobId), filters],
    queryFn: () => punchListApi.list({ jobId, ...filters }),
    enabled: !!jobId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function usePunchListItem(id: string) {
  return useQuery({
    queryKey: punchListKeys.detail(id),
    queryFn: () => punchListApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useJobPunchListSummary(jobId: string) {
  return useQuery({
    queryKey: punchListKeys.jobSummary(jobId),
    queryFn: () => punchListApi.getJobSummary(jobId),
    enabled: !!jobId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreatePunchListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePunchListItemInput) => punchListApi.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: punchListKeys.byJob(variables.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: punchListKeys.jobSummary(variables.jobId),
      });
    },
  });
}

export function useUpdatePunchListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      jobId: string;
      updates: UpdatePunchListItemInput;
    }) => punchListApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(punchListKeys.detail(variables.id), data);
      queryClient.invalidateQueries({
        queryKey: punchListKeys.byJob(variables.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: punchListKeys.jobSummary(variables.jobId),
      });
    },
  });
}

export function useDeletePunchListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; jobId: string }) =>
      punchListApi.delete(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: punchListKeys.byJob(variables.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: punchListKeys.jobSummary(variables.jobId),
      });
    },
  });
}
