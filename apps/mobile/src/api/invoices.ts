import { apiClient } from './client';
import type { Invoice } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface CreateInvoiceLineItemInput {
  expenseId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface CreateInvoiceInput {
  jobId: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  taxRate?: number;
  lineItems: CreateInvoiceLineItemInput[];
}

interface UpdateInvoiceInput {
  status?: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID';
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  taxRate?: number;
  lineItems?: CreateInvoiceLineItemInput[];
}

interface CreatePaymentInput {
  amount: number;
  date: string;
  method: 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'OTHER';
  note?: string;
}

interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: string;
  note?: string | null;
  createdAt: string;
}

export const invoicesApi = {
  list: async (params?: {
    jobId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Invoice>> => {
    const { data } = await apiClient.get('/invoices', { params });
    return data;
  },

  getById: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.get(`/invoices/${id}`);
    return data;
  },

  create: async (input: CreateInvoiceInput): Promise<Invoice> => {
    const { data } = await apiClient.post('/invoices', input);
    return data;
  },

  update: async (id: string, input: UpdateInvoiceInput): Promise<Invoice> => {
    const { data } = await apiClient.patch(`/invoices/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  addPayment: async (invoiceId: string, input: CreatePaymentInput): Promise<Invoice> => {
    const { data } = await apiClient.post(`/invoices/${invoiceId}/payments`, input);
    return data;
  },

  getPayments: async (invoiceId: string): Promise<InvoicePayment[]> => {
    const { data } = await apiClient.get(`/invoices/${invoiceId}/payments`);
    return data;
  },

  removePayment: async (invoiceId: string, paymentId: string): Promise<Invoice> => {
    const { data } = await apiClient.delete(`/invoices/${invoiceId}/payments/${paymentId}`);
    return data;
  },
};
