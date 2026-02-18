import { apiClient } from './client';
import type { ChangeOrder } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface CreateChangeOrderLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  costCodeId?: string;
}

interface CreateChangeOrderInput {
  jobId: string;
  title: string;
  description?: string;
  reason?: string;
  taxRate?: number;
  lineItems: CreateChangeOrderLineItemInput[];
}

interface UpdateChangeOrderInput {
  status?: 'DRAFT' | 'SUBMITTED';
  title?: string;
  description?: string;
  reason?: string;
  taxRate?: number;
  lineItems?: CreateChangeOrderLineItemInput[];
}

export const changeOrdersApi = {
  list: async (params: {
    jobId: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ChangeOrder>> => {
    const { data } = await apiClient.get('/change-orders', { params });
    return data;
  },

  getById: async (id: string): Promise<ChangeOrder> => {
    const { data } = await apiClient.get(`/change-orders/${id}`);
    return data;
  },

  create: async (input: CreateChangeOrderInput): Promise<ChangeOrder> => {
    const { data } = await apiClient.post('/change-orders', input);
    return data;
  },

  update: async (id: string, input: UpdateChangeOrderInput): Promise<ChangeOrder> => {
    const { data } = await apiClient.patch(`/change-orders/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/change-orders/${id}`);
  },

  approve: async (id: string): Promise<ChangeOrder> => {
    const { data } = await apiClient.post(`/change-orders/${id}/approve`);
    return data;
  },

  reject: async (id: string): Promise<ChangeOrder> => {
    const { data } = await apiClient.post(`/change-orders/${id}/reject`);
    return data;
  },
};
