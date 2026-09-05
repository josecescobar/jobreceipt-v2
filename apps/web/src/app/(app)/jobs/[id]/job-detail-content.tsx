'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Pencil, Archive } from 'lucide-react';
import { useApiClient } from '@/lib/api/hooks';
import type { Job, BudgetResponse } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const JOB_STATUSES = ['ACTIVE', 'COMPLETED', 'ARCHIVED'] as const;

const HEALTH_STYLES: Record<string, { label: string; color: string }> = {
  GREEN: { label: 'On Track', color: 'text-green-600' },
  YELLOW: { label: 'Nearing Limit', color: 'text-amber-600' },
  RED: { label: 'Over Budget', color: 'text-red-600' },
  UNSET: { label: 'No Budget Set', color: 'text-gray-500' },
};

interface Props {
  job: Job;
  budget: BudgetResponse | null;
}

export function JobDetailContent({ job, budget }: Props) {
  const router = useRouter();
  const api = useApiClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      setIsUpdating(true);
      try {
        await api.patch(`/jobs/${job.id}`, { status: newStatus });
        router.refresh();
      } finally {
        setIsUpdating(false);
      }
    },
    [api, job.id, router],
  );

  const handleArchive = useCallback(async () => {
    setIsUpdating(true);
    try {
      await api.patch(`/jobs/${job.id}`, { status: 'ARCHIVED' });
      setShowArchiveConfirm(false);
      router.refresh();
    } finally {
      setIsUpdating(false);
    }
  }, [api, job.id, router]);

  const health = budget ? HEALTH_STYLES[budget.health] ?? HEALTH_STYLES.UNSET : null;
  const budgetUsedPercent =
    budget && budget.totalBudgetCents > 0
      ? Math.round((budget.totalSpentCents / budget.totalBudgetCents) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/jobs">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{job.name}</h1>
          <StatusBadge status={job.status} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/jobs/${job.id}/edit`}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {job.status !== 'ARCHIVED' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowArchiveConfirm(true)}
            >
              <Archive className="mr-1 h-4 w-4" />
              Archive
            </Button>
          )}
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
          <Select value={job.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Customer" value={job.customerName} />
              <InfoRow label="Address" value={job.customerAddress} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Start Date"
                value={job.startDate ? new Date(job.startDate).toLocaleDateString() : null}
              />
              <InfoRow
                label="End Date"
                value={job.endDate ? new Date(job.endDate).toLocaleDateString() : null}
              />
            </CardContent>
          </Card>

          {job.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{job.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          {budget ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Budget Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Health</span>
                    {health && (
                      <span className={`font-semibold ${health.color}`}>
                        {health.label}
                      </span>
                    )}
                  </div>

                  {budget.totalBudgetCents > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatMoney(budget.totalSpentCents)} of{' '}
                          {formatMoney(budget.totalBudgetCents)}
                        </span>
                        <span className="font-medium">{budgetUsedPercent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${
                            budgetUsedPercent >= 100
                              ? 'bg-red-500'
                              : budgetUsedPercent >= 80
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-3">
                    <BudgetCard
                      label="Total"
                      budget={budget.totalBudgetCents}
                      spent={budget.totalSpentCents}
                      remaining={budget.totalRemainingCents}
                    />
                    <BudgetCard
                      label="Materials"
                      budget={job.budgetMaterialsCents}
                      spent={
                        budget.byCategory.find((c) => c.category?.toUpperCase() === 'MATERIALS')
                          ?.totalSpentCents ?? 0
                      }
                      remaining={
                        job.budgetMaterialsCents -
                        (budget.byCategory.find((c) => c.category?.toUpperCase() === 'MATERIALS')
                          ?.totalSpentCents ?? 0)
                      }
                    />
                    <BudgetCard
                      label="Labor"
                      budget={job.budgetLaborCents}
                      spent={
                        budget.byCategory.find((c) => c.category?.toUpperCase() === 'LABOR')
                          ?.totalSpentCents ?? 0
                      }
                      remaining={
                        job.budgetLaborCents -
                        (budget.byCategory.find((c) => c.category?.toUpperCase() === 'LABOR')
                          ?.totalSpentCents ?? 0)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {budget.byCategory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Spending by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {budget.byCategory.map((cat) => (
                        <div
                          key={cat.category ?? 'uncategorized'}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm capitalize">
                            {cat.category?.toLowerCase() ?? 'Uncategorized'}
                          </span>
                          <span className="text-sm font-medium">
                            {formatMoney(cat.totalSpentCents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-16 text-center">
              <p className="text-muted-foreground">
                Budget data is not available yet. Add expenses to this job to see budget tracking.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title="Archive Job"
        description={`Are you sure you want to archive "${job.name}"? This will hide it from active job lists. You can restore it later by changing the status.`}
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={handleArchive}
        loading={isUpdating}
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

function BudgetCard({
  label,
  budget,
  spent,
  remaining,
}: {
  label: string;
  budget: number;
  spent: number;
  remaining: number;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{formatMoney(budget)}</p>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Spent: {formatMoney(spent)}</span>
        <span className={remaining < 0 ? 'text-red-600' : ''}>
          Left: {formatMoney(remaining)}
        </span>
      </div>
    </div>
  );
}
