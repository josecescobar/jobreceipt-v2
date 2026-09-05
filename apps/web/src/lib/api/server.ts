import { auth } from '@clerk/nextjs/server';
import { createApiClient } from './client';

export async function getServerApiClient() {
  const { getToken, orgId } = await auth();
  return createApiClient(getToken, orgId ?? null);
}
