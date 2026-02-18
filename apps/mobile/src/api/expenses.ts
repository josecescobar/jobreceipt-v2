import { apiClient } from './client';
import type { Expense, ExpenseQueryDto, CreateExpenseDto, UpdateExpenseDto } from '@jobreceipt/shared';
import { processImage } from '../lib/image';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface UploadUrlResponse {
  uploadUrl: string;
  imageKey: string;
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

  batchDelete: async (ids: string[]): Promise<{ count: number }> => {
    const { data } = await apiClient.post('/expenses/batch/delete', { ids });
    return data;
  },

  batchUpdate: async (
    ids: string[],
    updates: { jobId?: string; category?: string },
  ): Promise<{ count: number }> => {
    const { data } = await apiClient.patch('/expenses/batch/update', { ids, ...updates });
    return data;
  },

  requestUploadUrl: async (fileName: string, contentType: string): Promise<UploadUrlResponse> => {
    const { data } = await apiClient.post('/expenses/upload-url', { fileName, contentType });
    return data;
  },

  getImageUrl: async (expenseId: string): Promise<{ imageUrl: string | null }> => {
    const { data } = await apiClient.get(`/expenses/${expenseId}/image-url`);
    return data;
  },

  /**
   * Upload an image from a local URI and return the S3 imageKey.
   */
  uploadImage: async (uri: string): Promise<string> => {
    const processed = await processImage(uri);
    const { uploadUrl, imageKey } = await expensesApi.requestUploadUrl('expense.jpg', 'image/jpeg');
    const response = await fetch(processed.uri);
    const blob = await response.blob();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'image/jpeg' },
    });
    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed (${uploadResponse.status})`);
    }
    return imageKey;
  },
};
