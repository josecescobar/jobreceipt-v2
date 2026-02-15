import { apiClient } from './client';
import type { CostCode } from '@jobreceipt/shared';

export const costCodesApi = {
  list: async (): Promise<CostCode[]> => {
    const { data } = await apiClient.get('/cost-codes');
    return data;
  },

  getById: async (id: string): Promise<CostCode> => {
    const { data } = await apiClient.get(`/cost-codes/${id}`);
    return data;
  },
};
