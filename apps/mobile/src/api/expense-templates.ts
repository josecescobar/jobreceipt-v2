import { apiClient } from './client';
import type { ExpenseTemplate } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface CreateExpenseTemplateInput {
  name: string;
  description?: string;
  amount?: number;
  category?: string;
  taxCategory?: string;
  costCodeId?: string;
  merchantName?: string;
}

type UpdateExpenseTemplateInput = Partial<CreateExpenseTemplateInput>;

export const expenseTemplatesApi = {
  list: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ExpenseTemplate>> => {
    const { data } = await apiClient.get('/expense-templates', { params });
    return data;
  },

  getById: async (id: string): Promise<ExpenseTemplate> => {
    const { data } = await apiClient.get(`/expense-templates/${id}`);
    return data;
  },

  create: async (input: CreateExpenseTemplateInput): Promise<ExpenseTemplate> => {
    const { data } = await apiClient.post('/expense-templates', input);
    return data;
  },

  saveFromExpense: async (name: string, expenseId: string): Promise<ExpenseTemplate> => {
    const { data } = await apiClient.post('/expense-templates/from-expense', {
      name,
      expenseId,
    });
    return data;
  },

  update: async (id: string, input: UpdateExpenseTemplateInput): Promise<ExpenseTemplate> => {
    const { data } = await apiClient.patch(`/expense-templates/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expense-templates/${id}`);
  },
};
