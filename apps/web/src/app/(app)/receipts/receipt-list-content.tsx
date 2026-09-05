'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useApiClient } from '@/lib/api/hooks';
import type { Receipt, Job } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReceiptFilters } from '@/components/receipts/receipt-filters';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { exportToCSV, csvFormatters, todayString } from '@/lib/export/csv';

interface Props {
  receipts: Receipt[];
  jobs: Job[];
  filters: {
    status?: string;
    jobId?: string;
    merchant?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function ReceiptListContent({ receipts, jobs, filters }: Props) {
  const router = useRouter();
  const api = useApiClient();
  const jobMap = new Map(jobs.map((j) => [j.id, j.name]));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allSelected = receipts.length > 0 && selected.size === receipts.length;

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(receipts.map((r) => r.id)));
    }
  }, [allSelected, receipts]);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const executeBulk = useCallback(
    async (action: 'APPROVE' | 'REJECT' | 'DELETE') => {
      if (selected.size === 0) return;
      setBulkLoading(true);
      try {
        await api.post('/receipts/bulk', {
          receiptIds: Array.from(selected),
          action,
        });
        setSelected(new Set());
        router.refresh();
      } finally {
        setBulkLoading(false);
      }
    },
    [api, selected, router],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Receipts</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToCSV(
                receipts.map((r) => ({
                  date: r.transactionDate ?? r.createdAt,
                  merchant: r.merchantName ?? 'Unknown',
                  amountCents: r.totalAmountCents,
                  status: r.status,
                  confidence: r.confidenceScore,
                  jobName: r.suggestedJobId
                    ? jobMap.get(r.suggestedJobId) ?? ''
                    : '',
                  createdAt: r.createdAt,
                })),
                `receipts-export-${todayString()}.csv`,
                [
                  { key: 'date', header: 'Date', formatter: csvFormatters.date },
                  { key: 'merchant', header: 'Merchant' },
                  { key: 'amountCents', header: 'Amount', formatter: csvFormatters.money },
                  { key: 'status', header: 'Status' },
                  { key: 'confidence', header: 'OCR Confidence', formatter: csvFormatters.confidence },
                  { key: 'jobName', header: 'Job' },
                  { key: 'createdAt', header: 'Created At', formatter: csvFormatters.date },
                ],
              )
            }
            disabled={receipts.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/receipts/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Receipt
            </Link>
          </Button>
        </div>
      </div>

      <ReceiptFilters jobs={jobs} filters={filters} />

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => executeBulk('APPROVE')}
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => executeBulk('REJECT')}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={bulkLoading}
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {receipts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">No receipts found.</p>
          <Button variant="link" asChild className="mt-2">
            <Link href="/receipts/upload">Upload your first receipt</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border"
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Job</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(receipt.id)}
                    onChange={() => toggleOne(receipt.id)}
                    className="h-4 w-4 rounded border-border"
                  />
                </TableCell>
                <TableCell className="text-sm">
                  {receipt.transactionDate
                    ? new Date(receipt.transactionDate).toLocaleDateString()
                    : new Date(receipt.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">
                  {receipt.merchantName ?? 'Unknown'}
                </TableCell>
                <TableCell>{formatMoney(receipt.totalAmountCents)}</TableCell>
                <TableCell>
                  <StatusBadge status={receipt.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {receipt.suggestedJobId
                    ? jobMap.get(receipt.suggestedJobId) ?? '—'
                    : '—'}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/receipts/${receipt.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Receipts"
        description={`Are you sure you want to delete ${selected.size} receipt${selected.size === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          setConfirmDelete(false);
          executeBulk('DELETE');
        }}
        loading={bulkLoading}
      />
    </div>
  );
}
