import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { timeTrackingApi } from '../api/time-tracking';
import type { TimeEntryQueryParams, CreateTimeEntryData, UpdateTimeEntryData } from '../api/time-tracking';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';

export const timeEntryKeys = {
  all: ['time-entries'] as const,
  lists: () => [...timeEntryKeys.all, 'list'] as const,
  list: (params: TimeEntryQueryParams) => [...timeEntryKeys.lists(), params] as const,
  details: () => [...timeEntryKeys.all, 'detail'] as const,
  detail: (id: string) => [...timeEntryKeys.details(), id] as const,
  summaries: () => [...timeEntryKeys.all, 'summary'] as const,
  summary: (params: Omit<TimeEntryQueryParams, 'page' | 'limit'>) =>
    [...timeEntryKeys.summaries(), params] as const,
};

export function useTimeEntries(params?: TimeEntryQueryParams) {
  return useInfiniteQuery({
    queryKey: timeEntryKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      timeTrackingApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useTimeEntry(id: string) {
  return useQuery({
    queryKey: timeEntryKeys.detail(id),
    queryFn: () => timeTrackingApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useTimeEntrySummary(params?: Omit<TimeEntryQueryParams, 'page' | 'limit'>) {
  return useQuery({
    queryKey: timeEntryKeys.summary(params ?? {}),
    queryFn: () => timeTrackingApi.getSummary(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimeEntryData) => timeTrackingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.summaries() });
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTimeEntryData }) =>
      timeTrackingApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(timeEntryKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.summaries() });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timeTrackingApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.summaries() });
    },
  });
}
