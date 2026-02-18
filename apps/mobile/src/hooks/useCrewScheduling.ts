import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  crewAssignmentsApi,
  type CreateCrewAssignmentInput,
  type UpdateCrewAssignmentInput,
} from '../api/crew-assignments';
import { QUERY_STALE_TIME } from '../lib/constants';

export const crewAssignmentKeys = {
  all: ['crew-assignments'] as const,
  lists: () => [...crewAssignmentKeys.all, 'list'] as const,
  list: (params: Record<string, any>) => [...crewAssignmentKeys.lists(), params] as const,
  details: () => [...crewAssignmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...crewAssignmentKeys.details(), id] as const,
  mySchedule: (params?: Record<string, any>) => [...crewAssignmentKeys.all, 'my-schedule', params] as const,
  today: () => [...crewAssignmentKeys.all, 'today'] as const,
};

export function useCrewAssignments(params?: {
  date?: string;
  startDate?: string;
  endDate?: string;
  jobId?: string;
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: crewAssignmentKeys.list(params ?? {}),
    queryFn: () => crewAssignmentsApi.list(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCrewAssignment(id: string) {
  return useQuery({
    queryKey: crewAssignmentKeys.detail(id),
    queryFn: () => crewAssignmentsApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useMySchedule(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: crewAssignmentKeys.mySchedule(params),
    queryFn: () => crewAssignmentsApi.getMySchedule(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useTodayAssignments() {
  return useQuery({
    queryKey: crewAssignmentKeys.today(),
    queryFn: () => crewAssignmentsApi.getToday(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateCrewAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCrewAssignmentInput) => crewAssignmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewAssignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: crewAssignmentKeys.today() });
    },
  });
}

export function useUpdateCrewAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateCrewAssignmentInput }) =>
      crewAssignmentsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(crewAssignmentKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: crewAssignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: crewAssignmentKeys.today() });
    },
  });
}

export function useDeleteCrewAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crewAssignmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewAssignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: crewAssignmentKeys.today() });
    },
  });
}
