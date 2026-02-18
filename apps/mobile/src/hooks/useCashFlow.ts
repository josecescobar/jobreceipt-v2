import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';
import { analyticsKeys } from '../lib/query-keys';
import { QUERY_STALE_TIME } from '../lib/constants';
import type { CashFlowForecast } from '@jobreceipt/shared';

export function useCashFlowForecast(months?: number) {
  return useQuery<CashFlowForecast>({
    queryKey: analyticsKeys.cashFlowForecast(months ?? 6),
    queryFn: () => analyticsApi.getCashFlowForecast(months),
    staleTime: QUERY_STALE_TIME,
  });
}
