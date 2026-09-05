'use client';

import { useMemo } from 'react';
import { Download } from 'lucide-react';
import type { Job, Expense, Receipt, BudgetResponse } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { exportToCSV, csvFormatters, todayString } from '@/lib/export/csv';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CATEGORY_COLORS: Record<string, string> = {
  MATERIALS: 'bg-blue-500',
  LABOR: 'bg-green-500',
  EQUIPMENT: 'bg-amber-500',
  SUBCONTRACTOR: 'bg-purple-500',
  OVERHEAD: 'bg-red-500',
};

const RECEIPT_STATUS_COLORS: Record<string, string> = {
  PROCESSING: 'bg-yellow-500',
  REVIEW: 'bg-blue-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
};

interface Props {
  jobs: Job[];
  expenses: Expense[];
  receipts: Receipt[];
  budgets: BudgetResponse[];
}

export function ReportsContent({ jobs, expenses, receipts, budgets }: Props) {
  const jobMap = useMemo(() => new Map(jobs.map((j) => [j.id, j.name])), [jobs]);

  // --- Spending analytics ---
  const totalSpending = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amountCents, 0),
    [expenses],
  );

  const spendingByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const cat = e.category ?? 'Uncategorized';
      map.set(cat, (map.get(cat) ?? 0) + e.amountCents);
    }
    return Array.from(map.entries())
      .map(([category, amountCents]) => ({ category, amountCents }))
      .sort((a, b) => b.amountCents - a.amountCents);
  }, [expenses]);

  const spendingByJob = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.jobId, (map.get(e.jobId) ?? 0) + e.amountCents);
    }
    return Array.from(map.entries())
      .map(([jobId, amountCents]) => ({
        jobId,
        jobName: jobMap.get(jobId) ?? 'Unknown Job',
        amountCents,
      }))
      .sort((a, b) => b.amountCents - a.amountCents);
  }, [expenses, jobMap]);

  const monthlySpending = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const month = e.date.slice(0, 7); // YYYY-MM
      map.set(month, (map.get(month) ?? 0) + e.amountCents);
    }
    return Array.from(map.entries())
      .map(([month, amountCents]) => ({ month, amountCents }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [expenses]);

  // --- Budget analytics ---
  const budgetMap = useMemo(() => new Map(budgets.map((b) => [b.jobId, b])), [budgets]);

  const budgetRows = useMemo(() => {
    return jobs
      .filter((j) => j.budgetTotalCents > 0)
      .map((j) => {
        const b = budgetMap.get(j.id);
        return {
          jobName: j.name,
          budgetCents: j.budgetTotalCents,
          spentCents: b?.totalSpentCents ?? 0,
          remainingCents: b?.totalRemainingCents ?? j.budgetTotalCents,
          health: b?.health ?? 'UNKNOWN',
          pct: b ? Math.round((b.totalSpentCents / j.budgetTotalCents) * 100) : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [jobs, budgetMap]);

  const budgetTotals = useMemo(() => {
    return budgetRows.reduce(
      (acc, r) => ({
        budgetCents: acc.budgetCents + r.budgetCents,
        spentCents: acc.spentCents + r.spentCents,
        remainingCents: acc.remainingCents + r.remainingCents,
      }),
      { budgetCents: 0, spentCents: 0, remainingCents: 0 },
    );
  }, [budgetRows]);

  // --- Receipt analytics ---
  const receiptStatusCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of receipts) {
      map.set(r.status, (map.get(r.status) ?? 0) + 1);
    }
    return map;
  }, [receipts]);

  const approvedReceiptTotal = useMemo(
    () =>
      receipts
        .filter((r) => r.status === 'APPROVED')
        .reduce((sum, r) => sum + (r.totalAmountCents ?? 0), 0),
    [receipts],
  );

  const avgConfidence = useMemo(() => {
    const scored = receipts.filter((r) => r.confidenceScore != null);
    if (scored.length === 0) return null;
    return scored.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / scored.length;
  }, [receipts]);

  const maxCategoryAmount = spendingByCategory[0]?.amountCents ?? 1;
  const totalReceiptCount = receipts.length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>

      <Tabs defaultValue="spending">
        <TabsList>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        {/* ── Spending Tab ── */}
        <TabsContent value="spending" className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCSV(
                  [
                    ...spendingByCategory.map((c) => ({
                      category: c.category,
                      amountCents: c.amountCents,
                    })),
                  ],
                  `report-spending-${todayString()}.csv`,
                  [
                    { key: 'category', header: 'Category' },
                    { key: 'amountCents', header: 'Amount', formatter: csvFormatters.money },
                  ],
                )
              }
              disabled={spendingByCategory.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Spending
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Spending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatMoney(totalSpending)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Categories Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{spendingByCategory.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Spending by category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {spendingByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expense data yet.</p>
              ) : (
                spendingByCategory.map(({ category, amountCents }) => {
                  const pct = Math.round((amountCents / maxCategoryAmount) * 100);
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{category}</span>
                        <span className="text-muted-foreground">
                          {formatMoney(amountCents)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${CATEGORY_COLORS[category] ?? 'bg-gray-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Spending by job */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spending by Job</CardTitle>
            </CardHeader>
            <CardContent>
              {spendingByJob.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expense data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spendingByJob.map(({ jobId, jobName, amountCents }) => (
                      <TableRow key={jobId}>
                        <TableCell className="font-medium">{jobName}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(amountCents)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Monthly trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Spending</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlySpending.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expense data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlySpending.map(({ month, amountCents }) => (
                      <TableRow key={month}>
                        <TableCell className="font-medium">{month}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(amountCents)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Budget Tab ── */}
        <TabsContent value="budget" className="space-y-6">
          {budgetRows.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportToCSV(
                    budgetRows.map((r) => ({
                      jobName: r.jobName,
                      budgetCents: r.budgetCents,
                      spentCents: r.spentCents,
                      remainingCents: r.remainingCents,
                      health: r.health.replace('_', ' '),
                    })),
                    `report-budgets-${todayString()}.csv`,
                    [
                      { key: 'jobName', header: 'Job Name' },
                      { key: 'budgetCents', header: 'Budget', formatter: csvFormatters.money },
                      { key: 'spentCents', header: 'Spent', formatter: csvFormatters.money },
                      { key: 'remainingCents', header: 'Remaining', formatter: csvFormatters.money },
                      { key: 'health', header: 'Health Status' },
                    ],
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Export Budgets
              </Button>
            </div>
          )}
          {budgetRows.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  No jobs with budgets configured yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Budget Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Spent</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead className="w-[200px]">Progress</TableHead>
                      <TableHead>Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetRows.map((row) => (
                      <TableRow key={row.jobName}>
                        <TableCell className="font-medium">{row.jobName}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.budgetCents)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.spentCents)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(row.remainingCents)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className={`h-2 rounded-full ${
                                  row.pct > 90
                                    ? 'bg-red-500'
                                    : row.pct > 70
                                      ? 'bg-amber-500'
                                      : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(row.pct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {row.pct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              row.health === 'ON_TRACK'
                                ? 'bg-green-100 text-green-800'
                                : row.health === 'WARNING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : row.health === 'OVER_BUDGET'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {row.health.replace('_', ' ')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals row */}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(budgetTotals.budgetCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(budgetTotals.spentCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(budgetTotals.remainingCents)}
                      </TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Receipts Tab ── */}
        <TabsContent value="receipts" className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Receipts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalReceiptCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatMoney(approvedReceiptTotal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {avgConfidence != null ? `${(avgConfidence * 100).toFixed(0)}%` : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receipt Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalReceiptCount === 0 ? (
                <p className="text-sm text-muted-foreground">No receipts yet.</p>
              ) : (
                ['PROCESSING', 'REVIEW', 'APPROVED', 'REJECTED'].map((status) => {
                  const count = receiptStatusCounts.get(status) ?? 0;
                  const pct =
                    totalReceiptCount > 0
                      ? Math.round((count / totalReceiptCount) * 100)
                      : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{status}</span>
                        <span className="text-muted-foreground">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${RECEIPT_STATUS_COLORS[status] ?? 'bg-gray-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
