import { apiClient } from './client';
import type { DailyLog } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDailyLogInput {
  jobId: string;
  date: string;
  weather?: string;
  temperature?: number;
  crewCount?: number;
  workPerformed: string;
  materialsUsed?: string;
  safetyNotes?: string;
  hoursWorked?: number;
  notes?: string;
}

export type UpdateDailyLogInput = Partial<
  Omit<CreateDailyLogInput, 'jobId' | 'date'>
>;

export interface DailyLogQueryParams {
  jobId: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const dailyLogsApi = {
  list: async (
    params: DailyLogQueryParams,
  ): Promise<PaginatedResponse<DailyLog>> => {
    const { data } = await apiClient.get('/daily-logs', { params });
    return data;
  },

  getById: async (id: string): Promise<DailyLog> => {
    const { data } = await apiClient.get(`/daily-logs/${id}`);
    return data;
  },

  create: async (input: CreateDailyLogInput): Promise<DailyLog> => {
    const { data } = await apiClient.post('/daily-logs', input);
    return data;
  },

  update: async (id: string, input: UpdateDailyLogInput): Promise<DailyLog> => {
    const { data } = await apiClient.patch(`/daily-logs/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/daily-logs/${id}`);
  },

  requestPhotoUploadUrl: async (
    logId: string,
  ): Promise<{ uploadUrl: string; imageKey: string }> => {
    const { data } = await apiClient.post(
      `/daily-logs/${logId}/photos/upload-url`,
    );
    return data;
  },

  createPhoto: async (
    logId: string,
    imageKey: string,
    caption?: string,
  ): Promise<any> => {
    const { data } = await apiClient.post(`/daily-logs/${logId}/photos`, {
      imageKey,
      caption,
    });
    return data;
  },

  deletePhoto: async (logId: string, photoId: string): Promise<void> => {
    await apiClient.delete(`/daily-logs/${logId}/photos/${photoId}`);
  },
};
