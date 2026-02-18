import { apiClient } from './client';

interface TimeEntry {
  id: string;
  organizationId: string;
  jobId: string;
  userId: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes: number;
  hourlyRate: number;
  totalCost: number;
  overtimeMinutes: number;
  overtimeRate?: number | null;
  isRunning: boolean;
  clockInAt?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string };
  user?: { id: string; name: string; email: string };
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface TimeEntrySummary {
  totalEntries: number;
  totalMinutes: number;
  totalCost: number;
  overtimeMinutes: number;
  regularMinutes: number;
}

interface TimeEntryQueryParams {
  jobId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface CreateTimeEntryData {
  jobId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  hourlyRate: number;
  overtimeRate?: number;
  description?: string;
}

interface UpdateTimeEntryData {
  jobId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  hourlyRate?: number;
  overtimeRate?: number;
  description?: string;
}

export const timeTrackingApi = {
  list: async (params?: TimeEntryQueryParams): Promise<PaginatedResponse<TimeEntry>> => {
    const { data } = await apiClient.get('/time-tracking', { params });
    return data;
  },

  getById: async (id: string): Promise<TimeEntry> => {
    const { data } = await apiClient.get(`/time-tracking/${id}`);
    return data;
  },

  create: async (entry: CreateTimeEntryData): Promise<TimeEntry> => {
    const { data } = await apiClient.post('/time-tracking', entry);
    return data;
  },

  update: async (id: string, updates: UpdateTimeEntryData): Promise<TimeEntry> => {
    const { data } = await apiClient.patch(`/time-tracking/${id}`, updates);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/time-tracking/${id}`);
  },

  getSummary: async (params?: Omit<TimeEntryQueryParams, 'page' | 'limit'>): Promise<TimeEntrySummary> => {
    const { data } = await apiClient.get('/time-tracking/summary', { params });
    return data;
  },

  clockIn: async (jobId: string, hourlyRate?: number): Promise<TimeEntry> => {
    const { data } = await apiClient.post('/time-tracking/clock-in', { jobId, hourlyRate });
    return data;
  },

  clockOut: async (id: string): Promise<TimeEntry> => {
    const { data } = await apiClient.post(`/time-tracking/${id}/clock-out`);
    return data;
  },

  getActive: async (): Promise<TimeEntry | null> => {
    const { data } = await apiClient.get('/time-tracking/active');
    return data;
  },
};

export type { TimeEntry, TimeEntrySummary, TimeEntryQueryParams, CreateTimeEntryData, UpdateTimeEntryData };
