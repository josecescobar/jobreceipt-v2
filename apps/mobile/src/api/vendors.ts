import { apiClient } from './client';
import type { Vendor, VendorSpending } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateVendorInput {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  defaultCategory?: string;
  defaultCostCodeId?: string;
  notes?: string;
}

export type UpdateVendorInput = Partial<CreateVendorInput>;

export interface VendorQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export const vendorsApi = {
  list: async (params?: VendorQuery): Promise<PaginatedResponse<Vendor>> => {
    const { data } = await apiClient.get('/vendors', { params });
    return data;
  },

  getById: async (id: string): Promise<Vendor> => {
    const { data } = await apiClient.get(`/vendors/${id}`);
    return data;
  },

  create: async (input: CreateVendorInput): Promise<Vendor> => {
    const { data } = await apiClient.post('/vendors', input);
    return data;
  },

  update: async (id: string, input: UpdateVendorInput): Promise<Vendor> => {
    const { data } = await apiClient.patch(`/vendors/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/vendors/${id}`);
  },

  getSpending: async (id: string): Promise<VendorSpending> => {
    const { data } = await apiClient.get(`/vendors/${id}/spending`);
    return data;
  },
};
