'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Receipt, Job } from '@/lib/api/types';
import { useApiClient } from '@/lib/api/hooks';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineItemsTable } from '@/components/receipts/line-items-table';
import { JobSuggestion } from '@/components/receipts/job-suggestion';

interface Props {
  receipt: Receipt;
  jobs: Job[];
}

export function ReceiptDetailContent({ receipt, jobs }: Props) {
  const router = useRouter();
  const api = useApiClient();
  const [selectedJobId, setSelectedJobId] = useState<string>(
    receipt.suggestedJobId ?? '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-refresh while processing
  useEffect(() => {
    if (receipt.status !== 'PROCESSING') return;
    const interval = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(interval);
  }, [receipt.status, router]);

  const handleApprove = useCallback(async () => {
    if (!selectedJobId) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/receipts/${receipt.id}`, {
        status: 'APPROVED',
        jobId: selectedJobId,
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }, [api, receipt.id, selectedJobId, router]);

  const handleReject = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await api.patch(`/receipts/${receipt.id}`, {
        status: 'REJECTED',
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }, [api, receipt.id, router]);

  // Convert s3:// URL to viewable HTTPS URL
  const imageUrl = receipt.imageUrl.startsWith('s3://')
    ? receipt.imageUrl
        .replace('s3://', 'https://')
        .replace(/^(https:\/\/)([^/]+)/, '$1$2.s3.amazonaws.com')
    : receipt.imageUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/receipts">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-xl font-bold">
          {receipt.merchantName ?? 'Receipt Detail'}
        </h1>
        <StatusBadge status={receipt.status} />
      </div>

      {receipt.status === 'PROCESSING' && (
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-medium">Processing receipt...</p>
              <p className="text-sm text-muted-foreground">
                OCR extraction is in progress. This page will refresh
                automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Image */}
        <Card>
          <CardContent className="p-4">
            {receipt.imageUrl === 'pending://upload' ? (
              <div className="flex h-64 items-center justify-center rounded bg-muted">
                <p className="text-sm text-muted-foreground">
                  Image pending upload
                </p>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="Receipt"
                className="w-full rounded object-contain"
              />
            )}
          </CardContent>
        </Card>

        {/* Right column: Data + Actions */}
        <div className="space-y-4">
          <Tabs defaultValue="summary">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="items">
                Line Items ({receipt.lineItems?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="job">Job Assignment</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card>
                <CardContent className="space-y-3 p-4">
                  <Row label="Merchant" value={receipt.merchantName} />
                  <Row label="Address" value={receipt.merchantAddress} />
                  <Row
                    label="Date"
                    value={
                      receipt.transactionDate
                        ? new Date(
                            receipt.transactionDate,
                          ).toLocaleDateString()
                        : null
                    }
                  />
                  <div className="border-t border-border pt-3" />
                  <Row
                    label="Subtotal"
                    value={formatMoney(receipt.subtotalCents)}
                  />
                  <Row
                    label="Tax"
                    value={formatMoney(receipt.taxAmountCents)}
                  />
                  <Row
                    label="Total"
                    value={formatMoney(receipt.totalAmountCents)}
                    bold
                  />
                  <div className="border-t border-border pt-3" />
                  <Row
                    label="Confidence"
                    value={
                      receipt.confidenceScore != null
                        ? `${receipt.confidenceScore}%`
                        : null
                    }
                  />
                  <Row label="Currency" value={receipt.currency} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items">
              <Card>
                <CardContent className="p-4">
                  <LineItemsTable items={receipt.lineItems ?? []} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="job">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Suggestion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                  <JobSuggestion
                    suggestedJobId={receipt.suggestedJobId}
                    suggestedScore={receipt.suggestedScore}
                    suggestedReasons={receipt.suggestedReasons}
                    jobs={jobs}
                  />

                  <div className="border-t border-border pt-4">
                    <label className="mb-2 block text-sm font-medium">
                      Assign to Job
                    </label>
                    <Select
                      value={selectedJobId}
                      onValueChange={setSelectedJobId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job..." />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs
                          .filter((j) => j.status === 'ACTIVE')
                          .map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {receipt.status === 'REVIEW' && (
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={!selectedJobId || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string | null | undefined;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'text-base font-semibold' : ''}>
        {value ?? '—'}
      </span>
    </div>
  );
}
