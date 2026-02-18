import { apiClient } from './client';
import type {
  ScheduleOfValues,
  DrawRequest,
  ProgressBillingSummary,
  ScheduleOfValuesItem,
} from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSOVInput {
  jobId: string;
  retainagePercent?: number;
  notes?: string;
  items: {
    itemNumber: string;
    description: string;
    scheduledValue: number;
    costCodeId?: string;
  }[];
}

export interface UpdateSOVInput {
  retainagePercent?: number;
  notes?: string;
}

export interface CreateSOVItemInput {
  itemNumber: string;
  description: string;
  scheduledValue: number;
  costCodeId?: string;
}

export interface CreateDrawRequestInput {
  scheduleId: string;
  periodTo: string;
  notes?: string;
  entries: {
    sovItemId: string;
    workCompletedThisPeriod: number;
    materialsStored?: number;
  }[];
}

export const progressBillingApi = {
  createSOV: async (input: CreateSOVInput): Promise<ScheduleOfValues> => {
    const { data } = await apiClient.post('/progress-billing/sov', input);
    return data;
  },

  listSOVs: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const { data } = await apiClient.get('/progress-billing/sov', { params });
    return data;
  },

  getSOV: async (id: string): Promise<ScheduleOfValues> => {
    const { data } = await apiClient.get(`/progress-billing/sov/${id}`);
    return data;
  },

  getSOVByJob: async (jobId: string): Promise<ScheduleOfValues> => {
    const { data } = await apiClient.get(
      `/progress-billing/sov/job/${jobId}`,
    );
    return data;
  },

  updateSOV: async (
    id: string,
    input: UpdateSOVInput,
  ): Promise<ScheduleOfValues> => {
    const { data } = await apiClient.patch(
      `/progress-billing/sov/${id}`,
      input,
    );
    return data;
  },

  addSOVItem: async (
    sovId: string,
    input: CreateSOVItemInput,
  ): Promise<ScheduleOfValuesItem> => {
    const { data } = await apiClient.post(
      `/progress-billing/sov/${sovId}/items`,
      input,
    );
    return data;
  },

  getSummary: async (sovId: string): Promise<ProgressBillingSummary> => {
    const { data } = await apiClient.get(
      `/progress-billing/sov/${sovId}/summary`,
    );
    return data;
  },

  createDrawRequest: async (
    input: CreateDrawRequestInput,
  ): Promise<DrawRequest> => {
    const { data } = await apiClient.post(
      '/progress-billing/draw-requests',
      input,
    );
    return data;
  },

  getDrawRequest: async (id: string): Promise<DrawRequest> => {
    const { data } = await apiClient.get(
      `/progress-billing/draw-requests/${id}`,
    );
    return data;
  },

  submitDrawRequest: async (id: string): Promise<DrawRequest> => {
    const { data } = await apiClient.post(
      `/progress-billing/draw-requests/${id}/submit`,
    );
    return data;
  },

  approveDrawRequest: async (id: string): Promise<DrawRequest> => {
    const { data } = await apiClient.post(
      `/progress-billing/draw-requests/${id}/approve`,
    );
    return data;
  },
};
