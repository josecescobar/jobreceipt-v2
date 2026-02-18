import { apiClient } from './client';
import type { AgingSummary } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const invoiceAgingApi = {
  getAgingSummary: async (): Promise<AgingSummary> => {
    const { data } = await apiClient.get('/invoices/aging');
    return data;
  },

  getOverdueInvoices: async (query: {
    bucket?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const { data } = await apiClient.get('/invoices/overdue', { params: query });
    return data;
  },

  sendReminder: async (invoiceId: string) => {
    const { data } = await apiClient.post(`/invoices/${invoiceId}/remind`);
    return data;
  },
};
