import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  equipmentApi,
  type CreateEquipmentInput,
  type UpdateEquipmentInput,
  type EquipmentQueryParams,
  type CheckOutEquipmentInput,
  type CreateMaintenanceLogInput,
} from '../api/equipment';
import { QUERY_STALE_TIME } from '../lib/constants';

export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (params?: EquipmentQueryParams) =>
    [...equipmentKeys.lists(), params] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
  summary: () => [...equipmentKeys.all, 'summary'] as const,
  jobEquipment: (jobId: string) =>
    [...equipmentKeys.all, 'job-equipment', jobId] as const,
  upcomingMaintenance: () =>
    [...equipmentKeys.all, 'upcoming-maintenance'] as const,
};

export function useEquipmentList(params?: EquipmentQueryParams) {
  return useQuery({
    queryKey: equipmentKeys.list(params),
    queryFn: () => equipmentApi.list(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useEquipment(id: string) {
  return useQuery({
    queryKey: equipmentKeys.detail(id),
    queryFn: () => equipmentApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useEquipmentSummary() {
  return useQuery({
    queryKey: equipmentKeys.summary(),
    queryFn: () => equipmentApi.getSummary(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useJobEquipment(jobId: string) {
  return useQuery({
    queryKey: equipmentKeys.jobEquipment(jobId),
    queryFn: () => equipmentApi.getJobEquipment(jobId),
    enabled: !!jobId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUpcomingMaintenance() {
  return useQuery({
    queryKey: equipmentKeys.upcomingMaintenance(),
    queryFn: () => equipmentApi.getUpcomingMaintenance(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEquipmentInput) => equipmentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.summary() });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateEquipmentInput;
    }) => equipmentApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(equipmentKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.summary() });
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => equipmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.summary() });
    },
  });
}

export function useCheckOutEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckOutEquipmentInput) => equipmentApi.checkOut(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.summary() });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.detail(variables.equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.jobEquipment(variables.jobId),
      });
    },
  });
}

export function useCheckInEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      notes,
    }: {
      assignmentId: string;
      equipmentId: string;
      jobId: string;
      notes?: string;
    }) => equipmentApi.checkIn(assignmentId, notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.summary() });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.detail(variables.equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.jobEquipment(variables.jobId),
      });
    },
  });
}

export function useCreateMaintenanceLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaintenanceLogInput) =>
      equipmentApi.createMaintenanceLog(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.detail(variables.equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.upcomingMaintenance(),
      });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.summary() });
    },
  });
}
