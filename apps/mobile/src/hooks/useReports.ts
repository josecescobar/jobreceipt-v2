import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';
import type { GenerateReportConfig } from '../api/reports';
import { QUERY_STALE_TIME } from '../lib/constants';

export const reportKeys = {
  all: ['reports'] as const,
  templates: () => [...reportKeys.all, 'templates'] as const,
};

export function useReportTemplates() {
  return useQuery({
    queryKey: reportKeys.templates(),
    queryFn: () => reportsApi.getTemplates(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: (config: GenerateReportConfig) => reportsApi.generateAndShare(config),
  });
}
