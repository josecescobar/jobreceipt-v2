import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  jobTemplatesApi,
  type CreateJobTemplateInput,
  type UpdateJobTemplateInput,
  type JobTemplateQuery,
} from '../api/job-templates';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';

export const jobTemplateKeys = {
  all: ['job-templates'] as const,
  lists: () => [...jobTemplateKeys.all, 'list'] as const,
  list: (params: JobTemplateQuery) => [...jobTemplateKeys.lists(), params] as const,
  details: () => [...jobTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobTemplateKeys.details(), id] as const,
};

export function useJobTemplates(params?: JobTemplateQuery) {
  return useInfiniteQuery({
    queryKey: jobTemplateKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      jobTemplatesApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useJobTemplate(id: string) {
  return useQuery({
    queryKey: jobTemplateKeys.detail(id),
    queryFn: () => jobTemplatesApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateJobTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobTemplateInput) => jobTemplatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobTemplateKeys.lists() });
    },
  });
}

export function useUpdateJobTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateJobTemplateInput }) =>
      jobTemplatesApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(jobTemplateKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: jobTemplateKeys.lists() });
    },
  });
}

export function useDeleteJobTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobTemplatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobTemplateKeys.lists() });
    },
  });
}

export function useCreateTemplateFromJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, name }: { jobId: string; name: string }) =>
      jobTemplatesApi.createFromJob(jobId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobTemplateKeys.lists() });
    },
  });
}
