'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useApiClient } from '@/lib/api/hooks';
import type { Expense, Job } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Props {
  expense: Expense;
  jobs: Job[];
}

export function ExpenseDetailContent({ expense, jobs }: Props) {
  const router = useRouter();
  const api = useApiClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const jobName = jobs.find((j) => j.id === expense.jobId)?.name ?? '—';

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/expenses/${expense.id}`);
      router.push('/expenses');
    } catch {
      setIsDeleting(false);
    }
  }, [api, expense.id, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/expenses">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{expense.description}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/expenses/${expense.id}/edit`}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {isDeleting ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-1 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Job" value={jobName} />
          <InfoRow label="Amount" value={formatMoney(expense.amountCents)} />
          <InfoRow
            label="Date"
            value={new Date(expense.date).toLocaleDateString()}
          />
          <InfoRow label="Category" value={expense.category} />
          <InfoRow label="Tax Category" value={expense.taxCategory} />
          <InfoRow
            label="Created"
            value={new Date(expense.createdAt).toLocaleDateString()}
          />
        </CardContent>
      </Card>

      {expense.receiptId && (
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/receipts/${expense.receiptId}`}>View Receipt</Link>
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Expense"
        description={`Are you sure you want to delete "${expense.description}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}
