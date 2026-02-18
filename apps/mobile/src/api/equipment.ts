import { apiClient } from './client';
import type {
  Equipment,
  EquipmentAssignment,
  MaintenanceLog,
  EquipmentSummary,
} from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateEquipmentInput {
  name: string;
  type?: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  notes?: string;
}

export type UpdateEquipmentInput = Partial<CreateEquipmentInput> & {
  status?: string;
};

export interface EquipmentQueryParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CheckOutEquipmentInput {
  equipmentId: string;
  jobId: string;
  notes?: string;
}

export interface CreateMaintenanceLogInput {
  equipmentId: string;
  type: string;
  description?: string;
  performedAt: string;
  cost?: number;
  notes?: string;
  nextDueDate?: string;
}

export const equipmentApi = {
  list: async (
    params?: EquipmentQueryParams,
  ): Promise<PaginatedResponse<Equipment>> => {
    const { data } = await apiClient.get('/equipment', { params });
    return data;
  },

  getById: async (id: string): Promise<Equipment> => {
    const { data } = await apiClient.get(`/equipment/${id}`);
    return data;
  },

  create: async (input: CreateEquipmentInput): Promise<Equipment> => {
    const { data } = await apiClient.post('/equipment', input);
    return data;
  },

  update: async (
    id: string,
    input: UpdateEquipmentInput,
  ): Promise<Equipment> => {
    const { data } = await apiClient.patch(`/equipment/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/equipment/${id}`);
  },

  getSummary: async (): Promise<EquipmentSummary> => {
    const { data } = await apiClient.get('/equipment/summary');
    return data;
  },

  checkOut: async (
    input: CheckOutEquipmentInput,
  ): Promise<EquipmentAssignment> => {
    const { data } = await apiClient.post('/equipment/check-out', input);
    return data;
  },

  checkIn: async (
    assignmentId: string,
    notes?: string,
  ): Promise<EquipmentAssignment> => {
    const { data } = await apiClient.post(
      `/equipment/${assignmentId}/check-in`,
      { notes },
    );
    return data;
  },

  createMaintenanceLog: async (
    input: CreateMaintenanceLogInput,
  ): Promise<MaintenanceLog> => {
    const { data } = await apiClient.post('/equipment/maintenance', input);
    return data;
  },

  getJobEquipment: async (jobId: string): Promise<EquipmentAssignment[]> => {
    const { data } = await apiClient.get(`/equipment/job/${jobId}`);
    return data;
  },

  getUpcomingMaintenance: async (): Promise<MaintenanceLog[]> => {
    const { data } = await apiClient.get('/equipment/upcoming-maintenance');
    return data;
  },
};
