'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useApiClient } from '@/lib/api/hooks';
import type { Expense, Job } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = ['MATERIALS', 'LABOR', 'EQUIPMENT', 'SUBCONTRACTOR', 'OVERHEAD'] as const;

interface Props {
  jobs: Job[];
  initialData?: Expense;
}

function toDateValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toISOString().split('T')[0];
}

export function ExpenseFormContent({ jobs, initialData }: Props) {
  const router = useRouter();
  const api = useApiClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState(initialData?.jobId ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');

  const isEdit = !!initialData;

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      const form = new FormData(e.currentTarget);
      const description = (form.get('description') as string)?.trim();
      const amountStr = form.get('amountCents') as string;
      const date = form.get('date') as string;

      if (!jobId) {
        setError('Job is required');
        setIsSubmitting(false);
        return;
      }

      if (!description) {
        setError('Description is required');
        setIsSubmitting(false);
        return;
      }

      if (!amountStr || isNaN(parseFloat(amountStr))) {
        setError('A valid amount is required');
        setIsSubmitting(false);
        return;
      }

      if (!date) {
        setError('Date is required');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        jobId,
        amountCents: Math.round(parseFloat(amountStr) * 100),
        description,
        date,
        category: category || undefined,
        taxCategory: (form.get('taxCategory') as string) || undefined,
      };

      try {
        if (initialData) {
          await api.patch(`/expenses/${initialData.id}`, payload);
          router.push(`/expenses/${initialData.id}`);
        } else {
          await api.post('/expenses', payload);
          router.push('/expenses');
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to ${isEdit ? 'update' : 'create'} expense`,
        );
        setIsSubmitting(false);
      }
    },
    [api, router, jobId, category, initialData, isEdit],
  );

  const backHref = initialData ? `/expenses/${initialData.id}` : '/expenses';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold">{isEdit ? 'Edit Expense' : 'New Expense'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Job *</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                name="description"
                placeholder="e.g. Lumber for framing"
                defaultValue={initialData?.description ?? ''}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amountCents">Amount ($) *</Label>
                <Input
                  id="amountCents"
                  name="amountCents"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  defaultValue={
                    initialData ? (initialData.amountCents / 100).toFixed(2) : ''
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={toDateValue(initialData?.date)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxCategory">Tax Category</Label>
                <Input
                  id="taxCategory"
                  name="taxCategory"
                  placeholder="e.g. line_22"
                  defaultValue={initialData?.taxCategory ?? ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Expense'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={backHref}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
