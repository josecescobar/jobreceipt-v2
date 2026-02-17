import { apiClient } from './client';
import type { AnalyticsSummary } from '@jobreceipt/shared';

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
}

export const analyticsApi = {
  getSummary: async (params?: AnalyticsQueryParams): Promise<AnalyticsSummary> => {
    const { data } = await apiClient.get('/analytics/summary', { params });
    return data;
  },
};
