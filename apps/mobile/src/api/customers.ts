import { apiClient } from './client';
import type { Customer, CustomerDetail } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCustomerInput {
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export interface CustomerQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export const customersApi = {
  list: async (params?: CustomerQuery): Promise<PaginatedResponse<Customer>> => {
    const { data } = await apiClient.get('/customers', { params });
    return data;
  },

  getById: async (id: string): Promise<CustomerDetail> => {
    const { data } = await apiClient.get(`/customers/${id}`);
    return data;
  },

  create: async (input: CreateCustomerInput): Promise<Customer> => {
    const { data } = await apiClient.post('/customers', input);
    return data;
  },

  update: async (id: string, input: UpdateCustomerInput): Promise<Customer> => {
    const { data } = await apiClient.patch(`/customers/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  getJobs: async (id: string, params?: { page?: number; limit?: number }) => {
    const { data } = await apiClient.get(`/customers/${id}/jobs`, { params });
    return data;
  },
};
