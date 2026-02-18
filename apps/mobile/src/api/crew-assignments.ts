import { apiClient } from './client';
import type { CrewAssignment } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCrewAssignmentInput {
  jobId: string;
  userId: string;
  dates: string[];
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export type UpdateCrewAssignmentInput = Partial<{
  status: string;
  startTime: string;
  endTime: string;
  notes: string;
}>;

export interface TodayJobGroup {
  job: { id: string; name: string };
  assignments: CrewAssignment[];
}

export const crewAssignmentsApi = {
  list: async (
    params?: {
      date?: string;
      startDate?: string;
      endDate?: string;
      jobId?: string;
      userId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResponse<CrewAssignment>> => {
    const { data } = await apiClient.get('/crew-assignments', { params });
    return data;
  },

  getById: async (id: string): Promise<CrewAssignment> => {
    const { data } = await apiClient.get(`/crew-assignments/${id}`);
    return data;
  },

  create: async (input: CreateCrewAssignmentInput) => {
    const { data } = await apiClient.post('/crew-assignments', input);
    return data as { created: number; skipped: number };
  },

  update: async (id: string, input: UpdateCrewAssignmentInput): Promise<CrewAssignment> => {
    const { data } = await apiClient.patch(`/crew-assignments/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/crew-assignments/${id}`);
  },

  getMySchedule: async (params?: { startDate?: string; endDate?: string }): Promise<CrewAssignment[]> => {
    const { data } = await apiClient.get('/crew-assignments/my-schedule', { params });
    return data;
  },

  getToday: async (): Promise<TodayJobGroup[]> => {
    const { data } = await apiClient.get('/crew-assignments/today');
    return data;
  },
};
