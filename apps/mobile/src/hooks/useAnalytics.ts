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

export function useJobProfitability(params?: AnalyticsQueryParams) {
  return useQuery({
    queryKey: analyticsKeys.profitability(params ?? {}),
    queryFn: () => analyticsApi.getProfitability(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useTaxSummary(year: number) {
  return useQuery({
    queryKey: analyticsKeys.taxSummary(year),
    queryFn: () => analyticsApi.getTaxSummary(year),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useWeeklyComparison() {
  return useQuery({
    queryKey: analyticsKeys.weeklyComparison(),
    queryFn: () => analyticsApi.getWeeklyComparison(),
    staleTime: QUERY_STALE_TIME,
  });
}
