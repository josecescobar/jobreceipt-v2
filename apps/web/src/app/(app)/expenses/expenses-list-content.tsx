'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { useApiClient } from '@/lib/api/hooks';
import type { Expense, Job } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { exportToCSV, csvFormatters, todayString } from '@/lib/export/csv';

const CATEGORIES = ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR', 'OVERHEAD'] as const;

interface Props {
  expenses: Expense[];
  jobs: Job[];
  filters: {
    jobId?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function ExpensesListContent({ expenses, jobs, filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useApiClient();
  const jobMap = new Map(jobs.map((j) => [j.id, j.name]));
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = useCallback(async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);
    try {
      await api.delete(`/expenses/${deletingExpense.id}`);
      setDeletingExpense(null);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }, [api, deletingExpense, router]);

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/expenses?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToCSV(
                expenses.map((e) => ({
                  date: e.date,
                  description: e.description,
                  amountCents: e.amountCents,
                  category: e.category ?? '',
                  jobName: jobMap.get(e.jobId) ?? '',
                  createdAt: e.createdAt,
                })),
                `expenses-export-${todayString()}.csv`,
                [
                  { key: 'date', header: 'Date', formatter: csvFormatters.date },
                  { key: 'description', header: 'Description' },
                  { key: 'amountCents', header: 'Amount', formatter: csvFormatters.money },
                  { key: 'category', header: 'Category' },
                  { key: 'jobName', header: 'Job' },
                  { key: 'createdAt', header: 'Created At', formatter: csvFormatters.date },
                ],
              )
            }
            disabled={expenses.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Expense
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.jobId ?? ''}
          onValueChange={(v) => updateFilter('jobId', v || undefined)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category ?? ''}
          onValueChange={(v) => updateFilter('category', v || undefined)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          placeholder="Start date"
          defaultValue={filters.startDate ?? ''}
          className="w-[160px]"
          onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
        />

        <Input
          type="date"
          placeholder="End date"
          defaultValue={filters.endDate ?? ''}
          className="w-[160px]"
          onChange={(e) => updateFilter('endDate', e.target.value || undefined)}
        />
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">No expenses found.</p>
          <Button variant="link" asChild className="mt-2">
            <Link href="/expenses/new">Add your first expense</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Job</TableHead>
              <TableHead className="w-[200px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-sm">
                  {new Date(expense.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>{formatMoney(expense.amountCents)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {expense.category ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {jobMap.get(expense.jobId) ?? '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/expenses/${expense.id}`}>View</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/expenses/${expense.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingExpense(expense)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    {expense.receiptId && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/receipts/${expense.receiptId}`}>Receipt</Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
        title="Delete Expense"
        description={`Are you sure you want to delete "${deletingExpense?.description}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}
