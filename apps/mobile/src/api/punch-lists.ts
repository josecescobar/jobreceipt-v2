import { apiClient } from './client';
import type {
  PunchListItem,
  PunchListSummary,
  PunchListPhoto,
} from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePunchListItemInput {
  jobId: string;
  title: string;
  description?: string;
  priority?: string;
  assignedToId?: string;
  dueDate?: string;
}

export type UpdatePunchListItemInput = Partial<CreatePunchListItemInput> & {
  status?: string;
};

export interface PunchListQueryParams {
  jobId: string;
  status?: string;
  assignedToId?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export const punchListApi = {
  list: async (
    params: PunchListQueryParams,
  ): Promise<PaginatedResponse<PunchListItem>> => {
    const { data } = await apiClient.get('/punch-lists', { params });
    return data;
  },

  getById: async (id: string): Promise<PunchListItem> => {
    const { data } = await apiClient.get(`/punch-lists/${id}`);
    return data;
  },

  create: async (input: CreatePunchListItemInput): Promise<PunchListItem> => {
    const { data } = await apiClient.post('/punch-lists', input);
    return data;
  },

  update: async (
    id: string,
    input: UpdatePunchListItemInput,
  ): Promise<PunchListItem> => {
    const { data } = await apiClient.patch(`/punch-lists/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/punch-lists/${id}`);
  },

  getJobSummary: async (jobId: string): Promise<PunchListSummary> => {
    const { data } = await apiClient.get(
      `/punch-lists/job-summary/${jobId}`,
    );
    return data;
  },

  getPhotoUploadUrl: async (
    itemId: string,
  ): Promise<{ uploadUrl: string; imageKey: string }> => {
    const { data } = await apiClient.post(
      `/punch-lists/${itemId}/photos/upload-url`,
    );
    return data;
  },

  createPhoto: async (
    itemId: string,
    imageKey: string,
    caption?: string,
  ): Promise<PunchListPhoto> => {
    const { data } = await apiClient.post(`/punch-lists/${itemId}/photos`, {
      imageKey,
      caption,
    });
    return data;
  },

  deletePhoto: async (itemId: string, photoId: string): Promise<void> => {
    await apiClient.delete(`/punch-lists/${itemId}/photos/${photoId}`);
  },
};
