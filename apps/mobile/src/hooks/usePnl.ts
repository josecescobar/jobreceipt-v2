import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';
import { QUERY_STALE_TIME } from '../lib/constants';

export const pnlKeys = {
  all: ['pnl'] as const,
  report: (params: { period?: string; startDate?: string; endDate?: string }) =>
    [...pnlKeys.all, params] as const,
};

export function usePnlReport(params: {
  period?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: pnlKeys.report(params),
    queryFn: () => analyticsApi.getPnlReport(params),
    staleTime: QUERY_STALE_TIME,
  });
}
