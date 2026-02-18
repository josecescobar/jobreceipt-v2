import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { mileageApi } from '../api/mileage';
import type { MileageQueryParams, CreateMileageTripData, UpdateMileageTripData } from '../api/mileage';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';

export const mileageKeys = {
  all: ['mileage'] as const,
  lists: () => [...mileageKeys.all, 'list'] as const,
  list: (params: MileageQueryParams) => [...mileageKeys.lists(), params] as const,
  details: () => [...mileageKeys.all, 'detail'] as const,
  detail: (id: string) => [...mileageKeys.details(), id] as const,
  summaries: () => [...mileageKeys.all, 'summary'] as const,
  summary: (params: Omit<MileageQueryParams, 'page' | 'limit'>) =>
    [...mileageKeys.summaries(), params] as const,
};

export function useMileageTrips(params?: MileageQueryParams) {
  return useInfiniteQuery({
    queryKey: mileageKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      mileageApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useMileageTrip(id: string) {
  return useQuery({
    queryKey: mileageKeys.detail(id),
    queryFn: () => mileageApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useMileageSummary(params?: Omit<MileageQueryParams, 'page' | 'limit'>) {
  return useQuery({
    queryKey: mileageKeys.summary(params ?? {}),
    queryFn: () => mileageApi.getSummary(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateMileageTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMileageTripData) => mileageApi.create(data),
    onMutate: async (newTrip) => {
      await queryClient.cancelQueries({ queryKey: mileageKeys.lists() });
      const listKey = mileageKeys.list({});
      const previous = queryClient.getQueryData(listKey);
      queryClient.setQueryData(listKey, (old: any) => {
        if (!old?.pages?.[0]) return old;
        const optimistic = {
          id: `__optimistic_${Date.now()}`,
          ...newTrip,
          irsRate: newTrip.irsRate ?? 0.7,
          totalDeduction: (newTrip.distanceMiles ?? 0) * (newTrip.irsRate ?? 0.7),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __optimistic: true,
        };
        return {
          ...old,
          pages: [
            { ...old.pages[0], data: [optimistic, ...old.pages[0].data] },
            ...old.pages.slice(1),
          ],
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(mileageKeys.list({}), context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mileageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mileageKeys.summaries() });
    },
  });
}

export function useUpdateMileageTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateMileageTripData }) =>
      mileageApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(mileageKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: mileageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mileageKeys.summaries() });
    },
  });
}

export function useDeleteMileageTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mileageApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mileageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mileageKeys.summaries() });
    },
  });
}
