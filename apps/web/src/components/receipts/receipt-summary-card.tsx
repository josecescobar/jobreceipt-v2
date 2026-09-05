'use client';

import Link from 'next/link';
import type { Receipt } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { StatusBadge } from '@/components/ui/status-badge';

export function ReceiptSummaryCard({ receipt }: { receipt: Receipt }) {
  return (
    <Link
      href={`/receipts/${receipt.id}`}
      className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          {receipt.merchantName ?? 'Unknown Merchant'}
        </span>
        <span className="text-xs text-muted-foreground">
          {receipt.transactionDate
            ? new Date(receipt.transactionDate).toLocaleDateString()
            : new Date(receipt.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">
          {formatMoney(receipt.totalAmountCents)}
        </span>
        <StatusBadge status={receipt.status} />
      </div>
    </Link>
  );
}
