import { apiClient } from './client';
import type { Estimate } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface CreateEstimateLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface CreateEstimateInput {
  jobId: string;
  issueDate?: string;
  expiresAt?: string;
  notes?: string;
  taxRate?: number;
  lineItems: CreateEstimateLineItemInput[];
}

interface UpdateEstimateInput {
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  issueDate?: string;
  expiresAt?: string;
  notes?: string;
  taxRate?: number;
  lineItems?: CreateEstimateLineItemInput[];
}

export const estimatesApi = {
  list: async (params?: {
    jobId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Estimate>> => {
    const { data } = await apiClient.get('/estimates', { params });
    return data;
  },

  getById: async (id: string): Promise<Estimate> => {
    const { data } = await apiClient.get(`/estimates/${id}`);
    return data;
  },

  create: async (input: CreateEstimateInput): Promise<Estimate> => {
    const { data } = await apiClient.post('/estimates', input);
    return data;
  },

  update: async (id: string, input: UpdateEstimateInput): Promise<Estimate> => {
    const { data } = await apiClient.patch(`/estimates/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/estimates/${id}`);
  },

  convertToInvoice: async (id: string): Promise<any> => {
    const { data } = await apiClient.post(`/estimates/${id}/convert`);
    return data;
  },
};
