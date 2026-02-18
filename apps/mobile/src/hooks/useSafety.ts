import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  safetyApi,
  type CreateInspectionInput,
  type UpdateInspectionInput,
  type CreateIncidentInput,
  type UpdateIncidentInput,
  type InspectionQueryParams,
  type IncidentQueryParams,
} from '../api/safety';
import { QUERY_STALE_TIME } from '../lib/constants';

export const safetyKeys = {
  all: ['safety'] as const,
  templates: () => [...safetyKeys.all, 'templates'] as const,
  summary: () => [...safetyKeys.all, 'summary'] as const,
  inspections: () => [...safetyKeys.all, 'inspections'] as const,
  inspectionLists: () => [...safetyKeys.inspections(), 'list'] as const,
  inspectionList: (params?: InspectionQueryParams) =>
    [...safetyKeys.inspectionLists(), params] as const,
  inspectionDetails: () => [...safetyKeys.inspections(), 'detail'] as const,
  inspectionDetail: (id: string) =>
    [...safetyKeys.inspectionDetails(), id] as const,
  incidents: () => [...safetyKeys.all, 'incidents'] as const,
  incidentLists: () => [...safetyKeys.incidents(), 'list'] as const,
  incidentList: (params?: IncidentQueryParams) =>
    [...safetyKeys.incidentLists(), params] as const,
  incidentDetails: () => [...safetyKeys.incidents(), 'detail'] as const,
  incidentDetail: (id: string) =>
    [...safetyKeys.incidentDetails(), id] as const,
};

// ─── Templates ──────────────────────────────────────────

export function useSafetyTemplates() {
  return useQuery({
    queryKey: safetyKeys.templates(),
    queryFn: () => safetyApi.getTemplates(),
    staleTime: QUERY_STALE_TIME,
  });
}

// ─── Summary ────────────────────────────────────────────

export function useSafetySummary() {
  return useQuery({
    queryKey: safetyKeys.summary(),
    queryFn: () => safetyApi.getSummary(),
    staleTime: QUERY_STALE_TIME,
  });
}

// ─── Inspections ────────────────────────────────────────

export function useInspectionList(params?: InspectionQueryParams) {
  return useQuery({
    queryKey: safetyKeys.inspectionList(params),
    queryFn: () => safetyApi.listInspections(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useInspection(id: string) {
  return useQuery({
    queryKey: safetyKeys.inspectionDetail(id),
    queryFn: () => safetyApi.getInspection(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInspectionInput) =>
      safetyApi.createInspection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: safetyKeys.inspectionLists(),
      });
      queryClient.invalidateQueries({ queryKey: safetyKeys.summary() });
    },
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateInspectionInput;
    }) => safetyApi.updateInspection(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        safetyKeys.inspectionDetail(variables.id),
        data,
      );
      queryClient.invalidateQueries({
        queryKey: safetyKeys.inspectionLists(),
      });
      queryClient.invalidateQueries({ queryKey: safetyKeys.summary() });
    },
  });
}

// ─── Incidents ──────────────────────────────────────────

export function useIncidentList(params?: IncidentQueryParams) {
  return useQuery({
    queryKey: safetyKeys.incidentList(params),
    queryFn: () => safetyApi.listIncidents(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: safetyKeys.incidentDetail(id),
    queryFn: () => safetyApi.getIncident(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIncidentInput) => safetyApi.createIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: safetyKeys.incidentLists(),
      });
      queryClient.invalidateQueries({ queryKey: safetyKeys.summary() });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateIncidentInput;
    }) => safetyApi.updateIncident(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        safetyKeys.incidentDetail(variables.id),
        data,
      );
      queryClient.invalidateQueries({
        queryKey: safetyKeys.incidentLists(),
      });
      queryClient.invalidateQueries({ queryKey: safetyKeys.summary() });
    },
  });
}

export function useUploadIncidentPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      incidentId,
      uri,
      caption,
    }: {
      incidentId: string;
      uri: string;
      caption?: string;
    }) => safetyApi.uploadIncidentPhoto(incidentId, uri, caption),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: safetyKeys.incidentDetail(variables.incidentId),
      });
    },
  });
}
