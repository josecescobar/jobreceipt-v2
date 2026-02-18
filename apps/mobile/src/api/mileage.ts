import { apiClient } from './client';

interface MileageTrip {
  id: string;
  organizationId: string;
  jobId: string;
  userId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distanceMiles: number;
  irsRate: number;
  totalDeduction: number;
  date: string;
  purpose?: string | null;
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

interface MileageSummary {
  totalTrips: number;
  totalMiles: number;
  totalDeduction: number;
}

interface MileageQueryParams {
  jobId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface CreateMileageTripData {
  jobId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distanceMiles: number;
  irsRate?: number;
  date: string;
  purpose?: string;
}

interface UpdateMileageTripData {
  jobId?: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  distanceMiles?: number;
  irsRate?: number;
  date?: string;
  purpose?: string;
}

export const mileageApi = {
  list: async (params?: MileageQueryParams): Promise<PaginatedResponse<MileageTrip>> => {
    const { data } = await apiClient.get('/mileage', { params });
    return data;
  },

  getById: async (id: string): Promise<MileageTrip> => {
    const { data } = await apiClient.get(`/mileage/${id}`);
    return data;
  },

  create: async (trip: CreateMileageTripData): Promise<MileageTrip> => {
    const { data } = await apiClient.post('/mileage', trip, {
      _offlineMeta: { type: 'mileage', description: trip.purpose || 'Mileage trip' },
    } as any);
    return data;
  },

  update: async (id: string, updates: UpdateMileageTripData): Promise<MileageTrip> => {
    const { data } = await apiClient.patch(`/mileage/${id}`, updates);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/mileage/${id}`);
  },

  getSummary: async (params?: Omit<MileageQueryParams, 'page' | 'limit'>): Promise<MileageSummary> => {
    const { data } = await apiClient.get('/mileage/summary', { params });
    return data;
  },
};

export type { MileageTrip, MileageSummary, MileageQueryParams, CreateMileageTripData, UpdateMileageTripData };
