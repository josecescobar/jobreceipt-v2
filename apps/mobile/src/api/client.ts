import axios from 'axios';
import { API_BASE_URL } from '../lib/constants';
import { useAuthStore } from '../stores/auth.store';

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
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — let Clerk handle re-auth
      console.warn('API 401: Token may be expired');
    }
    return Promise.reject(error);
  },
);
