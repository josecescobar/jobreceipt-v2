import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';

export const messageKeys = {
  all: ['messages'] as const,
  threads: () => [...messageKeys.all, 'threads'] as const,
  byJob: (jobId: string) => [...messageKeys.all, 'byJob', jobId] as const,
  unreadCount: () => [...messageKeys.all, 'unreadCount'] as const,
};

export function useThreads() {
  return useQuery({
    queryKey: messageKeys.threads(),
    queryFn: () => messagesApi.getThreads(),
    refetchInterval: 10000,
  });
}

export function useMessages(jobId: string) {
  return useQuery({
    queryKey: messageKeys.byJob(jobId),
    queryFn: () => messagesApi.getByJob({ jobId }),
    enabled: !!jobId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { jobId: string; body: string }) => messagesApi.send(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.byJob(variables.jobId) });
      queryClient.invalidateQueries({ queryKey: messageKeys.threads() });
      queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount() });
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => messagesApi.markRead(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.threads() });
      queryClient.invalidateQueries({ queryKey: messageKeys.unreadCount() });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: messageKeys.unreadCount(),
    queryFn: () => messagesApi.getUnreadCount(),
    refetchInterval: 15000,
  });
}
