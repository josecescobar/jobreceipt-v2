import { apiClient } from './client';
import type { Warranty, WarrantyClaim, WarrantySummary } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateWarrantyInput {
  jobId: string;
  title: string;
  description?: string;
  manufacturer?: string;
  warrantyProvider?: string;
  startDate: string;
  endDate: string;
  contactPhone?: string;
  contactEmail?: string;
  documentId?: string;
  notes?: string;
}

export type UpdateWarrantyInput = Partial<CreateWarrantyInput> & {
  status?: string;
};

export interface WarrantyQueryParams {
  status?: string;
  jobId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateWarrantyClaimInput {
  claimDate: string;
  description: string;
}

export const warrantyApi = {
  list: async (
    params?: WarrantyQueryParams,
  ): Promise<PaginatedResponse<Warranty>> => {
    const { data } = await apiClient.get('/warranties', { params });
    return data;
  },

  getById: async (id: string): Promise<Warranty> => {
    const { data } = await apiClient.get(`/warranties/${id}`);
    return data;
  },

  create: async (input: CreateWarrantyInput): Promise<Warranty> => {
    const { data } = await apiClient.post('/warranties', input);
    return data;
  },

  update: async (
    id: string,
    input: UpdateWarrantyInput,
  ): Promise<Warranty> => {
    const { data } = await apiClient.patch(`/warranties/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/warranties/${id}`);
  },

  getSummary: async (): Promise<WarrantySummary> => {
    const { data } = await apiClient.get('/warranties/summary');
    return data;
  },

  getUpcomingExpirations: async (): Promise<Warranty[]> => {
    const { data } = await apiClient.get('/warranties/upcoming-expirations');
    return data;
  },

  addClaim: async (
    warrantyId: string,
    input: CreateWarrantyClaimInput,
  ): Promise<WarrantyClaim> => {
    const { data } = await apiClient.post(
      `/warranties/${warrantyId}/claims`,
      input,
    );
    return data;
  },
};
