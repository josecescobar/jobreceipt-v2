import { apiClient } from './client';
import type { AnalyticsSummary, TaxSummary, ProfitabilityOverview, WeeklyComparison, CalendarData, PnlReport, CashFlowForecast } from '@jobreceipt/shared';

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

  getWeeklyComparison: async (): Promise<WeeklyComparison> => {
    const { data } = await apiClient.get('/analytics/weekly-comparison');
    return data;
  },

  getPnlReport: async (params: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PnlReport> => {
    const { data } = await apiClient.get('/analytics/pnl', { params });
    return data;
  },

  getCalendarData: async (params: {
    startDate: string;
    endDate: string;
    jobId?: string;
  }): Promise<CalendarData> => {
    const { data } = await apiClient.get('/analytics/calendar', { params });
    return data;
  },

  getCashFlowForecast: async (months?: number): Promise<CashFlowForecast> => {
    const { data } = await apiClient.get('/analytics/cash-flow', {
      params: months ? { months } : undefined,
    });
    return data;
  },
};
