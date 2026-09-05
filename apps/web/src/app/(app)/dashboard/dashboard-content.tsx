'use client';

import Link from 'next/link';
import { Receipt as ReceiptIcon, Upload, ArrowRight } from 'lucide-react';
import type { Receipt } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReceiptSummaryCard } from '@/components/receipts/receipt-summary-card';
import { formatMoney } from '@/lib/money';

const STATUS_LABELS = [
  { key: 'PROCESSING', label: 'Processing', color: 'text-amber-600' },
  { key: 'REVIEW', label: 'Needs Review', color: 'text-blue-600' },
  { key: 'APPROVED', label: 'Approved', color: 'text-green-600' },
  { key: 'REJECTED', label: 'Rejected', color: 'text-red-600' },
] as const;

export function DashboardContent({ receipts }: { receipts: Receipt[] }) {
  const counts = receipts.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalApproved = receipts
    .filter((r) => r.status === 'APPROVED')
    .reduce((sum, r) => sum + (r.totalAmountCents ?? 0), 0);

  const recent = receipts.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/receipts/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Receipt
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS_LABELS.map(({ key, label, color }) => (
          <Link key={key} href={`/receipts?status=${key}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <ReceiptIcon className={`h-4 w-4 ${color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${color}`}>
                  {counts[key] || 0}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Receipts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/receipts">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No receipts yet. Upload your first receipt to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {recent.map((receipt) => (
                  <ReceiptSummaryCard key={receipt.id} receipt={receipt} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Receipts
              </span>
              <span className="text-lg font-semibold">{receipts.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Approved Total
              </span>
              <span className="text-lg font-semibold">
                {formatMoney(totalApproved)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Pending Review
              </span>
              <span className="text-lg font-semibold text-blue-600">
                {counts['REVIEW'] || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
