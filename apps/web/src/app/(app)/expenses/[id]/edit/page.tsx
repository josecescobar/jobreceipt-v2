import { getServerApiClient } from '@/lib/api/server';
import type { Expense, Job, PaginatedResponse } from '@/lib/api/types';
import { ExpenseFormContent } from '../../new/expense-form-content';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({ params }: Props) {
  const { id } = await params;
  const api = await getServerApiClient();

  const [expense, jobsRes] = await Promise.all([
    api.get<Expense>(`/expenses/${id}`),
    api.get<PaginatedResponse<Job>>('/jobs?status=ACTIVE').catch(() => ({ data: [] as Job[] })),
  ]);

  return <ExpenseFormContent jobs={jobsRes.data} initialData={expense} />;
}
