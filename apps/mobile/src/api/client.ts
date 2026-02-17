import axios from 'axios';
import { API_BASE_URL } from '../lib/constants';
import { useAuthStore } from '../stores/auth.store';
import { offlineQueue } from '../lib/offline-queue';

// Token getter injected by auth provider
let getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  getToken = getter;
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  // Inject auth token
  if (getToken) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Inject organization ID
  const orgId = useAuthStore.getState().organizationId;
  if (orgId) {
    config.headers['x-organization-id'] = orgId;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear stale state so Clerk redirects to sign-in
      useAuthStore.getState().reset();
      return Promise.reject(error);
    }

    // Network error on write operations — queue for offline retry
    const method = error.config?.method?.toLowerCase();
    if (!error.response && method && ['post', 'patch', 'put', 'delete'].includes(method)) {
      await offlineQueue.enqueue({
        method: method.toUpperCase() as 'POST' | 'PATCH' | 'DELETE',
        url: error.config.url,
        data: error.config.data ? JSON.parse(error.config.data) : undefined,
      });
      return { data: { __queued: true }, status: 202 };
    }

    return Promise.reject(error);
  },
);
