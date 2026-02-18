import { apiClient } from './client';
import type { Job, JobPhoto, JobQueryDto, CreateJobDto, UpdateJobDto, BudgetSummary } from '@jobreceipt/shared';
import { processImage } from '../lib/image';

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

  getPhotos: async (jobId: string): Promise<JobPhoto[]> => {
    const { data } = await apiClient.get(`/jobs/${jobId}/photos`);
    return data;
  },

  requestPhotoUploadUrl: async (jobId: string): Promise<{ uploadUrl: string; imageKey: string }> => {
    const { data } = await apiClient.post(`/jobs/${jobId}/photos/upload-url`);
    return data;
  },

  createPhoto: async (jobId: string, imageKey: string, caption?: string): Promise<JobPhoto> => {
    const { data } = await apiClient.post(`/jobs/${jobId}/photos`, { imageKey, caption });
    return data;
  },

  deletePhoto: async (jobId: string, photoId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}/photos/${photoId}`);
  },

  uploadPhoto: async (jobId: string, uri: string, caption?: string): Promise<JobPhoto> => {
    const processed = await processImage(uri);
    const { uploadUrl, imageKey } = await jobsApi.requestPhotoUploadUrl(jobId);
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
    return jobsApi.createPhoto(jobId, imageKey, caption);
  },
};
