import { apiClient } from './client';
import type {
  Permit,
  PermitInspection,
  PermitSummary,
} from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePermitInput {
  jobId: string;
  permitNumber?: string;
  type: string;
  appliedDate?: string;
  issuedDate?: string;
  expiresAt?: string;
  authority?: string;
  fee?: number;
  documentId?: string;
  notes?: string;
}

export type UpdatePermitInput = Partial<CreatePermitInput> & {
  status?: string;
};

export interface PermitQueryParams {
  status?: string;
  type?: string;
  jobId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateInspectionInput {
  scheduledDate: string;
  inspector?: string;
  notes?: string;
}

export interface UpdateInspectionInput {
  completedDate?: string;
  result?: string;
  inspector?: string;
  notes?: string;
}

export const permitApi = {
  list: async (
    params?: PermitQueryParams,
  ): Promise<PaginatedResponse<Permit>> => {
    const { data } = await apiClient.get('/permits', { params });
    return data;
  },

  getById: async (id: string): Promise<Permit> => {
    const { data } = await apiClient.get(`/permits/${id}`);
    return data;
  },

  create: async (input: CreatePermitInput): Promise<Permit> => {
    const { data } = await apiClient.post('/permits', input);
    return data;
  },

  update: async (id: string, input: UpdatePermitInput): Promise<Permit> => {
    const { data } = await apiClient.patch(`/permits/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/permits/${id}`);
  },

  getSummary: async (): Promise<PermitSummary> => {
    const { data } = await apiClient.get('/permits/summary');
    return data;
  },

  getUpcomingInspections: async (): Promise<PermitInspection[]> => {
    const { data } = await apiClient.get('/permits/upcoming-inspections');
    return data;
  },

  getExpiringPermits: async (): Promise<Permit[]> => {
    const { data } = await apiClient.get('/permits/expiring');
    return data;
  },

  addInspection: async (
    permitId: string,
    input: CreateInspectionInput,
  ): Promise<PermitInspection> => {
    const { data } = await apiClient.post(
      `/permits/${permitId}/inspections`,
      input,
    );
    return data;
  },

  updateInspection: async (
    inspectionId: string,
    input: UpdateInspectionInput,
  ): Promise<PermitInspection> => {
    const { data } = await apiClient.patch(
      `/permits/inspections/${inspectionId}`,
      input,
    );
    return data;
  },
};
