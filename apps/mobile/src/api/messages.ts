import { apiClient } from './client';
import type { Message, JobThread } from '@jobreceipt/shared';

export const messagesApi = {
  send: async (data: { jobId: string; body: string }): Promise<Message> => {
    const { data: result } = await apiClient.post('/messages', data);
    return result;
  },

  getByJob: async (params: {
    jobId: string;
    before?: string;
    limit?: number;
  }): Promise<Message[]> => {
    const { data } = await apiClient.get('/messages', { params });
    return data;
  },

  getThreads: async (): Promise<JobThread[]> => {
    const { data } = await apiClient.get('/messages/threads');
    return data;
  },

  markRead: async (jobId: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post('/messages/mark-read', { jobId });
    return data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const { data } = await apiClient.get('/messages/unread-count');
    return data;
  },
};
