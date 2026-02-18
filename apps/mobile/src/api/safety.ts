import { apiClient } from './client';
import { processImage } from '../lib/image';
import type {
  SafetyInspection,
  SafetyIncident,
  SafetyIncidentPhoto,
  SafetyTemplate,
  SafetySummary,
} from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface InspectionQueryParams {
  jobId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface IncidentQueryParams {
  jobId?: string;
  status?: string;
  type?: string;
  severity?: string;
  page?: number;
  limit?: number;
}

export interface CreateInspectionInput {
  jobId: string;
  templateName: string;
}

export interface UpdateInspectionInput {
  items?: { id: string; isCompliant: boolean; notes?: string }[];
  notes?: string;
  status?: string;
}

export interface CreateIncidentInput {
  jobId: string;
  incidentDate: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  location?: string;
  witnesses?: string;
  actionTaken?: string;
  followUp?: string;
}

export interface UpdateIncidentInput {
  type?: string;
  severity?: string;
  title?: string;
  description?: string;
  location?: string;
  witnesses?: string;
  actionTaken?: string;
  followUp?: string;
  status?: string;
  resolvedAt?: string;
}

export const safetyApi = {
  getTemplates: async (): Promise<SafetyTemplate[]> => {
    const { data } = await apiClient.get('/safety/templates');
    return data;
  },

  createInspection: async (
    input: CreateInspectionInput,
  ): Promise<SafetyInspection> => {
    const { data } = await apiClient.post('/safety/inspections', input);
    return data;
  },

  listInspections: async (
    params?: InspectionQueryParams,
  ): Promise<PaginatedResponse<SafetyInspection>> => {
    const { data } = await apiClient.get('/safety/inspections', { params });
    return data;
  },

  getInspection: async (id: string): Promise<SafetyInspection> => {
    const { data } = await apiClient.get(`/safety/inspections/${id}`);
    return data;
  },

  updateInspection: async (
    id: string,
    input: UpdateInspectionInput,
  ): Promise<SafetyInspection> => {
    const { data } = await apiClient.patch(`/safety/inspections/${id}`, input);
    return data;
  },

  createIncident: async (
    input: CreateIncidentInput,
  ): Promise<SafetyIncident> => {
    const { data } = await apiClient.post('/safety/incidents', input);
    return data;
  },

  listIncidents: async (
    params?: IncidentQueryParams,
  ): Promise<PaginatedResponse<SafetyIncident>> => {
    const { data } = await apiClient.get('/safety/incidents', { params });
    return data;
  },

  getIncident: async (id: string): Promise<SafetyIncident> => {
    const { data } = await apiClient.get(`/safety/incidents/${id}`);
    return data;
  },

  updateIncident: async (
    id: string,
    input: UpdateIncidentInput,
  ): Promise<SafetyIncident> => {
    const { data } = await apiClient.patch(`/safety/incidents/${id}`, input);
    return data;
  },

  requestPhotoUploadUrl: async (
    incidentId: string,
  ): Promise<{ uploadUrl: string; imageKey: string }> => {
    const { data } = await apiClient.post(
      `/safety/incidents/${incidentId}/photos/upload-url`,
    );
    return data;
  },

  createIncidentPhoto: async (
    incidentId: string,
    imageKey: string,
    caption?: string,
  ): Promise<SafetyIncidentPhoto> => {
    const { data } = await apiClient.post(
      `/safety/incidents/${incidentId}/photos`,
      { imageKey, caption },
    );
    return data;
  },

  uploadIncidentPhoto: async (
    incidentId: string,
    uri: string,
    caption?: string,
  ): Promise<SafetyIncidentPhoto> => {
    const processed = await processImage(uri);
    const { uploadUrl, imageKey } =
      await safetyApi.requestPhotoUploadUrl(incidentId);
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
    return safetyApi.createIncidentPhoto(incidentId, imageKey, caption);
  },

  getSummary: async (): Promise<SafetySummary> => {
    const { data } = await apiClient.get('/safety/summary');
    return data;
  },
};
