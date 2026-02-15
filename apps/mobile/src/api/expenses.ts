import { apiClient } from './client';
import type { Expense, ExpenseQueryDto, CreateExpenseDto, UpdateExpenseDto } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const expensesApi = {
  list: async (params?: ExpenseQueryDto): Promise<PaginatedResponse<Expense>> => {
    const { data } = await apiClient.get('/expenses', { params });
    return data;
  },

  getById: async (id: string): Promise<Expense> => {
    const { data } = await apiClient.get(`/expenses/${id}`);
    return data;
  },

  create: async (expense: CreateExpenseDto): Promise<Expense> => {
    const { data } = await apiClient.post('/expenses', expense);
    return data;
  },

  update: async (id: string, updates: UpdateExpenseDto): Promise<Expense> => {
    const { data } = await apiClient.patch(`/expenses/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },
};
