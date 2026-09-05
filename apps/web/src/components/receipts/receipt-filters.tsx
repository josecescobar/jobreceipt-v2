'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { Job } from '@/lib/api/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUSES = ['PROCESSING', 'REVIEW', 'APPROVED', 'REJECTED'] as const;

interface ReceiptFiltersProps {
  jobs: Job[];
  filters: {
    status?: string;
    jobId?: string;
    merchant?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function ReceiptFilters({ jobs, filters }: ReceiptFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/receipts?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
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
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.jobId ?? ''}
        onValueChange={(v) => updateFilter('jobId', v || undefined)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Jobs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Jobs</SelectItem>
          {jobs.map((job) => (
            <SelectItem key={job.id} value={job.id}>
              {job.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Search merchant..."
        defaultValue={filters.merchant ?? ''}
        className="w-[200px]"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateFilter('merchant', e.currentTarget.value || undefined);
          }
        }}
      />

      <Input
        type="date"
        placeholder="Start date"
        defaultValue={filters.startDate ?? ''}
        className="w-[160px]"
        onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
      />

      <Input
        type="date"
        placeholder="End date"
        defaultValue={filters.endDate ?? ''}
        className="w-[160px]"
        onChange={(e) => updateFilter('endDate', e.target.value || undefined)}
      />
    </div>
  );
}
