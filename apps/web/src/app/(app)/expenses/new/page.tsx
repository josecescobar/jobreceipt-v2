import { getServerApiClient } from '@/lib/api/server';
import type { Job, PaginatedResponse } from '@/lib/api/types';
import { ExpenseFormContent } from './expense-form-content';

export default async function NewExpensePage() {
  const api = await getServerApiClient();

  const jobsRes = await api
    .get<PaginatedResponse<Job>>('/jobs?status=ACTIVE')
    .catch(() => ({ data: [] }));

  return <ExpenseFormContent jobs={jobsRes.data} />;
}
