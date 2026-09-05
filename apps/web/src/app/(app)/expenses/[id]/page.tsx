import { getServerApiClient } from '@/lib/api/server';
import type { Expense, Job, PaginatedResponse } from '@/lib/api/types';
import { ExpenseDetailContent } from './expense-detail-content';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExpenseDetailPage({ params }: Props) {
  const { id } = await params;
  const api = await getServerApiClient();

  const [expense, jobsRes] = await Promise.all([
    api.get<Expense>(`/expenses/${id}`),
    api.get<PaginatedResponse<Job>>('/jobs').catch(() => ({ data: [] as Job[] })),
  ]);

  return <ExpenseDetailContent expense={expense} jobs={jobsRes.data} />;
}
