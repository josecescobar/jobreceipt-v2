import { useQuery } from '@tanstack/react-query';
import { analyticsApi, AnalyticsQueryParams } from '../api/analytics';
import { analyticsKeys } from '../lib/query-keys';
import { QUERY_STALE_TIME } from '../lib/constants';

export { analyticsKeys };

export function useAnalyticsSummary(params?: AnalyticsQueryParams) {
  return useQuery({
    queryKey: analyticsKeys.summary(params ?? {}),
    queryFn: () => analyticsApi.getSummary(params),
    staleTime: QUERY_STALE_TIME,
  });
}
