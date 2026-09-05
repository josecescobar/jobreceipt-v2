import { getServerApiClient } from '@/lib/api/server';
import type { Expense, Job, PaginatedResponse } from '@/lib/api/types';
import { ExpensesListContent } from './expenses-list-content';

interface Props {
  searchParams: Promise<{
    jobId?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: Props) {
  const params = await searchParams;
  const api = await getServerApiClient();

  const query = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] => entry[1] != null,
    ),
  ).toString();

  const [expensesRes, jobsRes] = await Promise.all([
    api.get<PaginatedResponse<Expense>>(`/expenses${query ? `?${query}` : ''}`).catch(() => ({ data: [] })),
    api.get<PaginatedResponse<Job>>('/jobs').catch(() => ({ data: [] })),
  ]);

  return <ExpensesListContent expenses={expensesRes.data} jobs={jobsRes.data} filters={params} />;
}
