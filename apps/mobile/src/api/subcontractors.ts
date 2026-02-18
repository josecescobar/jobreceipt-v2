import { apiClient } from './client';
import type { Subcontractor, SubcontractorSummary } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSubcontractorInput {
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  trade?: string;
  licenseNumber?: string;
  insuranceExpiry?: string;
  w9Received?: boolean;
  notes?: string;
}

export type UpdateSubcontractorInput = Partial<CreateSubcontractorInput>;

export interface SubcontractorQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export const subcontractorsApi = {
  list: async (params?: SubcontractorQuery): Promise<PaginatedResponse<Subcontractor>> => {
    const { data } = await apiClient.get('/subcontractors', { params });
    return data;
  },

  getById: async (id: string): Promise<Subcontractor> => {
    const { data } = await apiClient.get(`/subcontractors/${id}`);
    return data;
  },

  create: async (input: CreateSubcontractorInput): Promise<Subcontractor> => {
    const { data } = await apiClient.post('/subcontractors', input);
    return data;
  },

  update: async (id: string, input: UpdateSubcontractorInput): Promise<Subcontractor> => {
    const { data } = await apiClient.patch(`/subcontractors/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/subcontractors/${id}`);
  },

  getSummary: async (id: string): Promise<SubcontractorSummary> => {
    const { data } = await apiClient.get(`/subcontractors/${id}/summary`);
    return data;
  },
};
