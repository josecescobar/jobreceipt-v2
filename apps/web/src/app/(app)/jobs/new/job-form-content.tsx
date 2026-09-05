'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useApiClient } from '@/lib/api/hooks';
import type { Job } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  initialData?: Job;
}

function toDollars(cents: number | undefined): string {
  if (!cents) return '';
  return (cents / 100).toFixed(2);
}

function toDateValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toISOString().split('T')[0];
}

export function JobFormContent({ initialData }: Props) {
  const router = useRouter();
  const api = useApiClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initialData;

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      const form = new FormData(e.currentTarget);
      const name = form.get('name') as string;

      if (!name.trim()) {
        setError('Job name is required');
        setIsSubmitting(false);
        return;
      }

      const toCents = (val: string | null) => {
        if (!val) return undefined;
        const num = parseFloat(val);
        return isNaN(num) ? undefined : Math.round(num * 100);
      };

      const payload = {
        name: name.trim(),
        customerName: (form.get('customerName') as string) || undefined,
        customerAddress: (form.get('customerAddress') as string) || undefined,
        budgetTotalCents: toCents(form.get('budgetTotalCents') as string),
        budgetMaterialsCents: toCents(form.get('budgetMaterialsCents') as string),
        budgetLaborCents: toCents(form.get('budgetLaborCents') as string),
        startDate: (form.get('startDate') as string) || undefined,
        endDate: (form.get('endDate') as string) || undefined,
        notes: (form.get('notes') as string) || undefined,
      };

      try {
        if (initialData) {
          await api.patch(`/jobs/${initialData.id}`, payload);
          router.push(`/jobs/${initialData.id}`);
        } else {
          const job = await api.post<Job>('/jobs', payload);
          router.push(`/jobs/${job.id}`);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} job`,
        );
        setIsSubmitting(false);
      }
    },
    [api, router, initialData, isEdit],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={initialData ? `/jobs/${initialData.id}` : '/jobs'}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold">{isEdit ? 'Edit Job' : 'New Job'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Job Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Smith Roof Replacement"
                defaultValue={initialData?.name ?? ''}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  placeholder="e.g. John Smith"
                  defaultValue={initialData?.customerName ?? ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Customer Address</Label>
                <Input
                  id="customerAddress"
                  name="customerAddress"
                  placeholder="e.g. 121 Main St, Hagerstown, MD"
                  defaultValue={initialData?.customerAddress ?? ''}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={toDateValue(initialData?.startDate)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={toDateValue(initialData?.endDate)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Optional notes about the job"
                defaultValue={initialData?.notes ?? ''}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budgetTotalCents">Total Budget ($)</Label>
              <Input
                id="budgetTotalCents"
                name="budgetTotalCents"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={toDollars(initialData?.budgetTotalCents)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budgetMaterialsCents">Materials Budget ($)</Label>
                <Input
                  id="budgetMaterialsCents"
                  name="budgetMaterialsCents"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  defaultValue={toDollars(initialData?.budgetMaterialsCents)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetLaborCents">Labor Budget ($)</Label>
                <Input
                  id="budgetLaborCents"
                  name="budgetLaborCents"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  defaultValue={toDollars(initialData?.budgetLaborCents)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Job'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={initialData ? `/jobs/${initialData.id}` : '/jobs'}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
