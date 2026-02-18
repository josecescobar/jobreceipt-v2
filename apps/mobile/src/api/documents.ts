import { apiClient } from './client';
import type { Document } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDocumentInput {
  name: string;
  type?: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  jobId?: string;
  vendorId?: string;
  subcontractorId?: string;
  expiresAt?: string;
  notes?: string;
}

export type UpdateDocumentInput = Partial<{
  name: string;
  type: string;
  notes: string;
  expiresAt: string;
}>;

export interface DocumentQuery {
  type?: string;
  jobId?: string;
  vendorId?: string;
  subcontractorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const documentsApi = {
  requestUploadUrl: async (fileName: string, contentType: string) => {
    const { data } = await apiClient.post('/documents/upload-url', { fileName, contentType });
    return data as { uploadUrl: string; fileKey: string };
  },

  create: async (input: CreateDocumentInput): Promise<Document> => {
    const { data } = await apiClient.post('/documents', input);
    return data;
  },

  list: async (params?: DocumentQuery): Promise<PaginatedResponse<Document>> => {
    const { data } = await apiClient.get('/documents', { params });
    return data;
  },

  getById: async (id: string): Promise<Document> => {
    const { data } = await apiClient.get(`/documents/${id}`);
    return data;
  },

  update: async (id: string, input: UpdateDocumentInput): Promise<Document> => {
    const { data } = await apiClient.patch(`/documents/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },
};
