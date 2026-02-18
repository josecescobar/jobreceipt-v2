import { apiClient } from './client';
import type { JobTemplate } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateJobTemplateLineItemInput {
  description: string;
  category?: string;
  estimatedAmount?: number;
  costCodeId?: string;
}

export interface CreateJobTemplateInput {
  name: string;
  description?: string;
  customerName?: string;
  budgetTotal?: number;
  budgetMaterials?: number;
  budgetLabor?: number;
  contractValue?: number;
  notes?: string;
  lineItems?: CreateJobTemplateLineItemInput[];
}

export interface UpdateJobTemplateInput {
  name?: string;
  description?: string;
  customerName?: string;
  budgetTotal?: number;
  budgetMaterials?: number;
  budgetLabor?: number;
  contractValue?: number;
  notes?: string;
  lineItems?: CreateJobTemplateLineItemInput[];
}

export interface JobTemplateQuery {
  page?: number;
  limit?: number;
}

export const jobTemplatesApi = {
  list: async (params?: JobTemplateQuery): Promise<PaginatedResponse<JobTemplate>> => {
    const { data } = await apiClient.get('/job-templates', { params });
    return data;
  },

  getById: async (id: string): Promise<JobTemplate> => {
    const { data } = await apiClient.get(`/job-templates/${id}`);
    return data;
  },

  create: async (body: CreateJobTemplateInput): Promise<JobTemplate> => {
    const { data } = await apiClient.post('/job-templates', body);
    return data;
  },

  update: async (id: string, updates: UpdateJobTemplateInput): Promise<JobTemplate> => {
    const { data } = await apiClient.patch(`/job-templates/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/job-templates/${id}`);
  },

  createFromJob: async (jobId: string, name: string): Promise<JobTemplate> => {
    const { data } = await apiClient.post(`/job-templates/from-job/${jobId}`, { name });
    return data;
  },
};
