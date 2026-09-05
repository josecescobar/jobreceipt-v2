'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Plus, Pencil, Archive } from 'lucide-react';
import { useApiClient } from '@/lib/api/hooks';
import type { Job } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
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

const JOB_STATUSES = ['ACTIVE', 'COMPLETED', 'ARCHIVED'] as const;

interface Props {
  jobs: Job[];
  filters: {
    status?: string;
  };
}

export function JobsListContent({ jobs, filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useApiClient();
  const [archivingJob, setArchivingJob] = useState<Job | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const confirmArchive = useCallback(async () => {
    if (!archivingJob) return;
    setIsArchiving(true);
    try {
      await api.patch(`/jobs/${archivingJob.id}`, { status: 'ARCHIVED' });
      setArchivingJob(null);
      router.refresh();
    } finally {
      setIsArchiving(false);
    }
  }, [api, archivingJob, router]);

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/jobs?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.status ?? ''}
          onValueChange={(v) => updateFilter('status', v || undefined)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {JOB_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">No jobs found.</p>
          <Button variant="link" asChild className="mt-2">
            <Link href="/jobs/new">Create your first job</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead className="w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {job.customerName ?? '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={job.status} />
                </TableCell>
                <TableCell>{formatMoney(job.budgetTotalCents)}</TableCell>
                <TableCell className="text-sm">
                  {job.startDate
                    ? new Date(job.startDate).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/jobs/${job.id}`}>View</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/jobs/${job.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    {job.status !== 'ARCHIVED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setArchivingJob(job)}
                      >
                        <Archive className="h-3.5 w-3.5" />
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
        open={!!archivingJob}
        onOpenChange={(open) => !open && setArchivingJob(null)}
        title="Archive Job"
        description={`Are you sure you want to archive "${archivingJob?.name}"? This will hide it from active job lists.`}
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={confirmArchive}
        loading={isArchiving}
      />
    </div>
  );
}
