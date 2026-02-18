import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { closeOutApi } from '../api/close-out';
import { jobKeys } from './useJobs';
import { QUERY_STALE_TIME } from '../lib/constants';

export const closeOutKeys = {
  all: ['close-out'] as const,
  byJob: (jobId: string) => [...closeOutKeys.all, 'job', jobId] as const,
  progress: (jobId: string) =>
    [...closeOutKeys.all, 'progress', jobId] as const,
};

export function useCloseOut(jobId: string) {
  return useQuery({
    queryKey: closeOutKeys.byJob(jobId),
    queryFn: () => closeOutApi.getByJob(jobId),
    enabled: !!jobId,
    staleTime: QUERY_STALE_TIME,
    retry: false,
  });
}

export function useCloseOutProgress(jobId: string) {
  return useQuery({
    queryKey: closeOutKeys.progress(jobId),
    queryFn: () => closeOutApi.getProgress(jobId),
    enabled: !!jobId,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useInitiateCloseOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      customItems,
    }: {
      jobId: string;
      customItems?: string[];
    }) => closeOutApi.initiate(jobId, customItems),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: closeOutKeys.byJob(variables.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: closeOutKeys.progress(variables.jobId),
      });
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      jobId: _jobId,
      updates,
    }: {
      itemId: string;
      jobId: string;
      updates: { status: string; notes?: string };
    }) => closeOutApi.updateChecklistItem(itemId, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: closeOutKeys.byJob(variables.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: closeOutKeys.progress(variables.jobId),
      });
    },
  });
}

export function useUpdateCloseOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      jobId: _jobId,
      updates,
    }: {
      id: string;
      jobId: string;
      updates: {
        walkthroughDate?: string;
        walkthroughNotes?: string;
        customerSignedName?: string;
      };
    }) => closeOutApi.updateCloseOut(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: closeOutKeys.byJob(variables.jobId),
      });
    },
  });
}

export function useSaveSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      jobId: _jobId,
      signatureKey,
      customerName,
    }: {
      id: string;
      jobId: string;
      signatureKey: string;
      customerName: string;
    }) => closeOutApi.saveSignature(id, signatureKey, customerName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: closeOutKeys.byJob(variables.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: closeOutKeys.progress(variables.jobId),
      });
    },
  });
}

export function useCompleteCloseOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      jobId: _jobId,
    }: {
      id: string;
      jobId: string;
    }) => closeOutApi.complete(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: closeOutKeys.byJob(variables.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: closeOutKeys.progress(variables.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: jobKeys.detail(variables.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: jobKeys.lists(),
      });
    },
  });
}
