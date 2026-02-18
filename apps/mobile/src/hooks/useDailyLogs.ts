import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  dailyLogsApi,
  type CreateDailyLogInput,
  type UpdateDailyLogInput,
  type DailyLogQueryParams,
} from '../api/daily-logs';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';

export const dailyLogKeys = {
  all: ['daily-logs'] as const,
  lists: () => [...dailyLogKeys.all, 'list'] as const,
  list: (params: DailyLogQueryParams) =>
    [...dailyLogKeys.lists(), params] as const,
  details: () => [...dailyLogKeys.all, 'detail'] as const,
  detail: (id: string) => [...dailyLogKeys.details(), id] as const,
};

export function useDailyLogs(params: DailyLogQueryParams) {
  return useInfiniteQuery({
    queryKey: dailyLogKeys.list(params),
    queryFn: ({ pageParam = 1 }) =>
      dailyLogsApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: !!params.jobId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useDailyLog(id: string) {
  return useQuery({
    queryKey: dailyLogKeys.detail(id),
    queryFn: () => dailyLogsApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateDailyLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDailyLogInput) => dailyLogsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyLogKeys.lists() });
    },
  });
}

export function useUpdateDailyLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateDailyLogInput }) =>
      dailyLogsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(dailyLogKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: dailyLogKeys.lists() });
    },
  });
}

export function useDeleteDailyLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dailyLogsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyLogKeys.lists() });
    },
  });
}
