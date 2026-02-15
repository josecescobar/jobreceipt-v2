import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { jobsApi } from '../api/jobs';
import type { JobQueryDto, CreateJobDto, UpdateJobDto } from '@jobreceipt/shared';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (params: JobQueryDto) => [...jobKeys.lists(), params] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  budgets: () => [...jobKeys.all, 'budget'] as const,
  budget: (id: string) => [...jobKeys.budgets(), id] as const,
};

export function useJobs(params?: JobQueryDto) {
  return useInfiniteQuery({
    queryKey: jobKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      jobsApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => jobsApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useJobBudget(id: string) {
  return useQuery({
    queryKey: jobKeys.budget(id),
    queryFn: () => jobsApi.getBudget(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (job: CreateJobDto) => jobsApi.create(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateJobDto }) =>
      jobsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(jobKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}
