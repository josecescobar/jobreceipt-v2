import { apiClient } from './client';
import type { CostCode } from '@jobreceipt/shared';

export interface CreateCostCodeInput {
  code: string;
  name: string;
  category: string;
}

export type UpdateCostCodeInput = Partial<CreateCostCodeInput>;

export const costCodesApi = {
  list: async (): Promise<CostCode[]> => {
    const { data } = await apiClient.get('/cost-codes');
    return data;
  },

  getById: async (id: string): Promise<CostCode> => {
    const { data } = await apiClient.get(`/cost-codes/${id}`);
    return data;
  },

  create: async (input: CreateCostCodeInput): Promise<CostCode> => {
    const { data } = await apiClient.post('/cost-codes', input);
    return data;
  },

  update: async (id: string, input: UpdateCostCodeInput): Promise<CostCode> => {
    const { data } = await apiClient.patch(`/cost-codes/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/cost-codes/${id}`);
  },

  seedDefaults: async (): Promise<{ created: number; skipped: number }> => {
    const { data } = await apiClient.post('/cost-codes/seed-defaults');
    return data;
  },
};
