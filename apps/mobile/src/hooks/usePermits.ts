import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  permitApi,
  type CreatePermitInput,
  type UpdatePermitInput,
  type PermitQueryParams,
  type CreateInspectionInput,
  type UpdateInspectionInput,
} from '../api/permits';
import { QUERY_STALE_TIME } from '../lib/constants';

export const permitKeys = {
  all: ['permits'] as const,
  lists: () => [...permitKeys.all, 'list'] as const,
  list: (params?: PermitQueryParams) =>
    [...permitKeys.lists(), params] as const,
  details: () => [...permitKeys.all, 'detail'] as const,
  detail: (id: string) => [...permitKeys.details(), id] as const,
  summary: () => [...permitKeys.all, 'summary'] as const,
  upcomingInspections: () =>
    [...permitKeys.all, 'upcomingInspections'] as const,
  expiring: () => [...permitKeys.all, 'expiring'] as const,
};

export function usePermitList(params?: PermitQueryParams) {
  return useQuery({
    queryKey: permitKeys.list(params),
    queryFn: () => permitApi.list(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function usePermit(id: string) {
  return useQuery({
    queryKey: permitKeys.detail(id),
    queryFn: () => permitApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function usePermitSummary() {
  return useQuery({
    queryKey: permitKeys.summary(),
    queryFn: () => permitApi.getSummary(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUpcomingInspections() {
  return useQuery({
    queryKey: permitKeys.upcomingInspections(),
    queryFn: () => permitApi.getUpcomingInspections(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useExpiringPermits() {
  return useQuery({
    queryKey: permitKeys.expiring(),
    queryFn: () => permitApi.getExpiringPermits(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreatePermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePermitInput) => permitApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: permitKeys.summary() });
    },
  });
}

export function useUpdatePermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdatePermitInput;
    }) => permitApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(permitKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: permitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: permitKeys.summary() });
      queryClient.invalidateQueries({ queryKey: permitKeys.expiring() });
    },
  });
}

export function useDeletePermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permitApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: permitKeys.summary() });
      queryClient.invalidateQueries({ queryKey: permitKeys.expiring() });
    },
  });
}

export function useAddInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      permitId,
      data,
    }: {
      permitId: string;
      data: CreateInspectionInput;
    }) => permitApi.addInspection(permitId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: permitKeys.detail(variables.permitId),
      });
      queryClient.invalidateQueries({
        queryKey: permitKeys.upcomingInspections(),
      });
    },
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      inspectionId,
      permitId,
      data,
    }: {
      inspectionId: string;
      permitId: string;
      data: UpdateInspectionInput;
    }) => permitApi.updateInspection(inspectionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: permitKeys.detail(variables.permitId),
      });
      queryClient.invalidateQueries({
        queryKey: permitKeys.upcomingInspections(),
      });
    },
  });
}
