import { getServerApiClient } from '@/lib/api/server';
import type { Receipt, Job, PaginatedResponse } from '@/lib/api/types';
import { ReceiptListContent } from './receipt-list-content';

interface Props {
  searchParams: Promise<{
    status?: string;
    jobId?: string;
    merchant?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function ReceiptsPage({ searchParams }: Props) {
  const params = await searchParams;
  const api = await getServerApiClient();

  const query = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] => entry[1] != null,
    ),
  ).toString();

  const [receiptsRes, jobsRes] = await Promise.all([
    api.get<PaginatedResponse<Receipt>>(`/receipts${query ? `?${query}` : ''}`).catch(() => ({ data: [] })),
    api.get<PaginatedResponse<Job>>('/jobs').catch(() => ({ data: [] })),
  ]);

  return <ReceiptListContent receipts={receiptsRes.data} jobs={jobsRes.data} filters={params} />;
}
