'use client';

import { useAuth, useOrganization } from '@clerk/nextjs';
import { useMemo } from 'react';
import { createApiClient } from './client';

export function useApiClient() {
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  return useMemo(
    () => createApiClient(getToken, organization?.id ?? null),
    [getToken, organization?.id],
  );
}
