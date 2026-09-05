export interface ApiError {
  statusCode: number;
  path: string;
  requestId: string;
  error: string | Record<string, unknown>;
  timestamp: string;
}

export class ApiClientError extends Error {
  constructor(public readonly response: ApiError) {
    super(
      typeof response.error === 'string'
        ? response.error
        : JSON.stringify(response.error),
    );
  }
}

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export function createApiClient(
  getToken: () => Promise<string | null>,
  orgId: string | null,
) {
  const baseUrl = '/api';

  async function request<T>(
    path: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (orgId) headers['x-org-id'] = orgId;

    const res = await fetch(`${baseUrl}${path}`, { ...options, headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({
        statusCode: res.status,
        error: res.statusText,
        path,
        requestId: '',
        timestamp: new Date().toISOString(),
      }));
      throw new ApiClientError(body as ApiError);
    }

    return res.json() as Promise<T>;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),
    put: (url: string, body: Blob | ArrayBuffer, contentType: string) =>
      fetch(url, {
        method: 'PUT',
        body,
        headers: { 'Content-Type': contentType },
      }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  };
}
