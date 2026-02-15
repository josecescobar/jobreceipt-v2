import { apiClient } from './client';
import type { Job, JobQueryDto, CreateJobDto, UpdateJobDto, BudgetSummary } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const jobsApi = {
  list: async (params?: JobQueryDto): Promise<PaginatedResponse<Job>> => {
    const { data } = await apiClient.get('/jobs', { params });
    return data;
  },

  getById: async (id: string): Promise<Job> => {
    const { data } = await apiClient.get(`/jobs/${id}`);
    return data;
  },

  create: async (job: CreateJobDto): Promise<Job> => {
    const { data } = await apiClient.post('/jobs', job);
    return data;
  },

  update: async (id: string, updates: UpdateJobDto): Promise<Job> => {
    const { data } = await apiClient.patch(`/jobs/${id}`, updates);
    return data;
  },

  getBudget: async (id: string): Promise<BudgetSummary> => {
    const { data } = await apiClient.get(`/jobs/${id}/budget`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobs/${id}`);
  },
};
