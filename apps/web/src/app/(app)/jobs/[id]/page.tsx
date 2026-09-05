import { getServerApiClient } from '@/lib/api/server';
import type { Job, BudgetResponse } from '@/lib/api/types';
import { JobDetailContent } from './job-detail-content';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const api = await getServerApiClient();

  const [job, budget] = await Promise.all([
    api.get<Job>(`/jobs/${id}`),
    api.get<BudgetResponse>(`/jobs/${id}/budget`).catch(() => null),
  ]);

  return <JobDetailContent job={job} budget={budget} />;
}
