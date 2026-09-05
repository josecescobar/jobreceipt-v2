import { getServerApiClient } from '@/lib/api/server';
import type { Job } from '@/lib/api/types';
import { JobFormContent } from '../../new/job-form-content';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: Props) {
  const { id } = await params;
  const api = await getServerApiClient();
  const job = await api.get<Job>(`/jobs/${id}`);

  return <JobFormContent initialData={job} />;
}
