import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';
import { QUERY_STALE_TIME } from '../lib/constants';

export const calendarKeys = {
  all: ['calendar'] as const,
  data: (params: { startDate: string; endDate: string; jobId?: string }) =>
    [...calendarKeys.all, params] as const,
};

export function useCalendarData(params: {
  startDate: string;
  endDate: string;
  jobId?: string;
}) {
  return useQuery({
    queryKey: calendarKeys.data(params),
    queryFn: () => analyticsApi.getCalendarData(params),
    enabled: !!params.startDate && !!params.endDate,
    staleTime: QUERY_STALE_TIME,
  });
}
