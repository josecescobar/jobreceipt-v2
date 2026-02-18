import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  progressBillingApi,
  type CreateSOVInput,
  type UpdateSOVInput,
  type CreateSOVItemInput,
  type CreateDrawRequestInput,
} from '../api/progress-billing';
import { QUERY_STALE_TIME } from '../lib/constants';

export const progressBillingKeys = {
  all: ['progress-billing'] as const,
  sovs: () => [...progressBillingKeys.all, 'sov'] as const,
  sovList: (params?: any) => [...progressBillingKeys.sovs(), 'list', params] as const,
  sovDetail: (id: string) => [...progressBillingKeys.sovs(), 'detail', id] as const,
  sovByJob: (jobId: string) => [...progressBillingKeys.sovs(), 'by-job', jobId] as const,
  sovSummary: (id: string) => [...progressBillingKeys.sovs(), 'summary', id] as const,
  drawRequests: () => [...progressBillingKeys.all, 'draw-request'] as const,
  drawRequestDetail: (id: string) =>
    [...progressBillingKeys.drawRequests(), 'detail', id] as const,
};

// ─── SOV Hooks ─────────────────────────────────────────────

export function useSOVList(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: progressBillingKeys.sovList(params),
    queryFn: () => progressBillingApi.listSOVs(params),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useSOV(id: string) {
  return useQuery({
    queryKey: progressBillingKeys.sovDetail(id),
    queryFn: () => progressBillingApi.getSOV(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useSOVByJob(jobId: string) {
  return useQuery({
    queryKey: progressBillingKeys.sovByJob(jobId),
    queryFn: () => progressBillingApi.getSOVByJob(jobId),
    enabled: !!jobId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useSOVSummary(sovId: string) {
  return useQuery({
    queryKey: progressBillingKeys.sovSummary(sovId),
    queryFn: () => progressBillingApi.getSummary(sovId),
    enabled: !!sovId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateSOV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSOVInput) => progressBillingApi.createSOV(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressBillingKeys.sovs() });
    },
  });
}

export function useUpdateSOV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateSOVInput }) =>
      progressBillingApi.updateSOV(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.sovDetail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.sovSummary(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: progressBillingKeys.sovs() });
    },
  });
}

export function useAddSOVItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sovId, data }: { sovId: string; data: CreateSOVItemInput }) =>
      progressBillingApi.addSOVItem(sovId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.sovDetail(variables.sovId),
      });
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.sovSummary(variables.sovId),
      });
    },
  });
}

// ─── Draw Request Hooks ────────────────────────────────────

export function useDrawRequest(id: string) {
  return useQuery({
    queryKey: progressBillingKeys.drawRequestDetail(id),
    queryFn: () => progressBillingApi.getDrawRequest(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateDrawRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDrawRequestInput) =>
      progressBillingApi.createDrawRequest(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.sovDetail(variables.scheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.sovSummary(variables.scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: progressBillingKeys.sovs() });
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.drawRequests(),
      });
    },
  });
}

export function useSubmitDrawRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => progressBillingApi.submitDrawRequest(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.drawRequestDetail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.sovDetail(data.scheduleId),
      });
    },
  });
}

export function useApproveDrawRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => progressBillingApi.approveDrawRequest(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.drawRequestDetail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.sovDetail(data.scheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: progressBillingKeys.sovSummary(data.scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: progressBillingKeys.sovs() });
    },
  });
}
