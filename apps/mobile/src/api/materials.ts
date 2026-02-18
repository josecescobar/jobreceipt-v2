import { apiClient } from './client';
import type {
  MaterialItem,
  MaterialUsageLog,
  MaterialSummary,
} from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateMaterialItemInput {
  jobId: string;
  name: string;
  sku?: string;
  unit?: string;
  unitCost: number;
  category?: string;
  costCodeId?: string;
  purchasedQty?: number;
  notes?: string;
}

export type UpdateMaterialItemInput = Partial<CreateMaterialItemInput>;

export interface MaterialQueryParams {
  jobId?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const materialsApi = {
  list: async (
    params?: MaterialQueryParams,
  ): Promise<PaginatedResponse<MaterialItem>> => {
    const { data } = await apiClient.get('/materials', { params });
    return data;
  },

  getById: async (id: string): Promise<MaterialItem> => {
    const { data } = await apiClient.get(`/materials/${id}`);
    return data;
  },

  create: async (input: CreateMaterialItemInput): Promise<MaterialItem> => {
    const { data } = await apiClient.post('/materials', input);
    return data;
  },

  update: async (
    id: string,
    input: UpdateMaterialItemInput,
  ): Promise<MaterialItem> => {
    const { data } = await apiClient.patch(`/materials/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/materials/${id}`);
  },

  logUsage: async (input: {
    materialItemId: string;
    qty: number;
    jobId?: string;
    notes?: string;
  }): Promise<MaterialUsageLog> => {
    const { data } = await apiClient.post('/materials/log-usage', input);
    return data;
  },

  getJobSummary: async (jobId: string): Promise<MaterialSummary> => {
    const { data } = await apiClient.get(`/materials/job-summary/${jobId}`);
    return data;
  },

  getInventorySummary: async (): Promise<
    MaterialSummary & { lowStockItems: number }
  > => {
    const { data } = await apiClient.get('/materials/inventory-summary');
    return data;
  },
};
