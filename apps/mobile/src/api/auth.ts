import { apiClient } from './client';

export interface BootstrapResponse {
  user: { id: string; email: string; name: string | null };
  organizations: Array<{ id: string; name: string; role: string }>;
  defaultOrganizationId: string | null;
}

export const authApi = {
  bootstrap: async (): Promise<BootstrapResponse> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  registerPushToken: async (token: string): Promise<void> => {
    await apiClient.post('/auth/push-token', { token });
  },

  updateNotificationPrefs: async (prefs: Record<string, boolean>): Promise<void> => {
    await apiClient.patch('/auth/notification-prefs', prefs);
  },
};
