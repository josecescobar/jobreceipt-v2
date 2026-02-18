import { apiClient } from './client';
import type { RecurringInvoice } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateRecurringInvoiceLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateRecurringInvoiceInput {
  jobId: string;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  startDate: string;
  endDate?: string;
  notes?: string;
  taxRate?: number;
  lineItems: CreateRecurringInvoiceLineItemInput[];
}

export interface UpdateRecurringInvoiceInput {
  frequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  startDate?: string;
  endDate?: string;
  notes?: string;
  taxRate?: number;
  isActive?: boolean;
  lineItems?: CreateRecurringInvoiceLineItemInput[];
}

export interface RecurringInvoiceQuery {
  isActive?: string;
  jobId?: string;
  page?: number;
  limit?: number;
}

export const recurringInvoicesApi = {
  list: async (params?: RecurringInvoiceQuery): Promise<PaginatedResponse<RecurringInvoice>> => {
    const { data } = await apiClient.get('/recurring-invoices', { params });
    return data;
  },

  getById: async (id: string): Promise<RecurringInvoice> => {
    const { data } = await apiClient.get(`/recurring-invoices/${id}`);
    return data;
  },

  create: async (body: CreateRecurringInvoiceInput): Promise<RecurringInvoice> => {
    const { data } = await apiClient.post('/recurring-invoices', body);
    return data;
  },

  update: async (id: string, updates: UpdateRecurringInvoiceInput): Promise<RecurringInvoice> => {
    const { data } = await apiClient.patch(`/recurring-invoices/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/recurring-invoices/${id}`);
  },
};
