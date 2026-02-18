import { apiClient } from './client';
import type {
  RecurringExpense,
  CreateRecurringExpenseDto,
  UpdateRecurringExpenseDto,
  RecurringExpenseQueryDto,
} from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const recurringExpensesApi = {
  list: async (params?: RecurringExpenseQueryDto): Promise<PaginatedResponse<RecurringExpense>> => {
    const { data } = await apiClient.get('/recurring-expenses', { params });
    return data;
  },

  getById: async (id: string): Promise<RecurringExpense> => {
    const { data } = await apiClient.get(`/recurring-expenses/${id}`);
    return data;
  },

  create: async (body: CreateRecurringExpenseDto): Promise<RecurringExpense> => {
    const { data } = await apiClient.post('/recurring-expenses', body);
    return data;
  },

  update: async (id: string, updates: UpdateRecurringExpenseDto): Promise<RecurringExpense> => {
    const { data } = await apiClient.patch(`/recurring-expenses/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/recurring-expenses/${id}`);
  },
};
