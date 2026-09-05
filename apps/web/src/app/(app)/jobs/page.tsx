import { getServerApiClient } from '@/lib/api/server';
import type { Job, PaginatedResponse } from '@/lib/api/types';
import { JobsListContent } from './jobs-list-content';

interface Props {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function JobsPage({ searchParams }: Props) {
  const params = await searchParams;
  const api = await getServerApiClient();

  const query = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] => entry[1] != null,
    ),
  ).toString();

  const jobsRes = await api
    .get<PaginatedResponse<Job>>(`/jobs${query ? `?${query}` : ''}`)
    .catch(() => ({ data: [] }));

  return <JobsListContent jobs={jobsRes.data} filters={params} />;
}
