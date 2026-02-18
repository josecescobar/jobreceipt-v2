import { apiClient } from './client';
import type { AnalyticsSummary, TaxSummary, ProfitabilityOverview } from '@jobreceipt/shared';

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
}

export const analyticsApi = {
  getSummary: async (params?: AnalyticsQueryParams): Promise<AnalyticsSummary> => {
    const { data } = await apiClient.get('/analytics/summary', { params });
    return data;
  },

  getTaxSummary: async (year: number): Promise<TaxSummary> => {
    const { data } = await apiClient.get('/analytics/tax-summary', {
      params: { year },
    });
    return data;
  },

  getProfitability: async (params?: AnalyticsQueryParams): Promise<ProfitabilityOverview> => {
    const { data } = await apiClient.get('/analytics/profitability', { params });
    return data;
  },
};
