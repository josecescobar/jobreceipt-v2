import { QueryClient } from '@tanstack/react-query';

/** Shared ref so non-React code (e.g. offline queue sync) can invalidate queries */
let _queryClient: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  _queryClient = client;
}

export function getQueryClient(): QueryClient | null {
  return _queryClient;
}
