import { getServerApiClient } from '@/lib/api/server';
import type { Job, Expense, Receipt, PaginatedResponse, BudgetResponse } from '@/lib/api/types';
import { ReportsContent } from './reports-content';

export default async function ReportsPage() {
  const api = await getServerApiClient();

  const [jobsRes, expensesRes, receiptsRes] = await Promise.all([
    api
      .get<PaginatedResponse<Job>>('/jobs?limit=100')
      .catch(() => ({ data: [] as Job[], meta: null })),
    api
      .get<PaginatedResponse<Expense>>('/expenses?limit=100')
      .catch(() => ({ data: [] as Expense[], meta: null })),
    api
      .get<PaginatedResponse<Receipt>>('/receipts?limit=100')
      .catch(() => ({ data: [] as Receipt[], meta: null })),
  ]);

  const jobs = jobsRes.data;
  const expenses = expensesRes.data;
  const receipts = receiptsRes.data;

  // Fetch budget data for each job that has a budget
  const budgets = await Promise.all(
    jobs
      .filter((j) => j.budgetTotalCents > 0)
      .map((j) =>
        api
          .get<BudgetResponse>(`/jobs/${j.id}/budget`)
          .catch(() => null),
      ),
  );

  const budgetData = budgets.filter((b): b is BudgetResponse => b !== null);

  return (
    <ReportsContent
      jobs={jobs}
      expenses={expenses}
      receipts={receipts}
      budgets={budgetData}
    />
  );
}
