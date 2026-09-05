import { getServerApiClient } from '@/lib/api/server';
import type { Receipt, Job } from '@/lib/api/types';
import { ReceiptDetailContent } from './receipt-detail-content';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReceiptDetailPage({ params }: Props) {
  const { id } = await params;
  const api = await getServerApiClient();

  const [receipt, jobs] = await Promise.all([
    api.get<Receipt>(`/receipts/${id}`),
    api.get<Job[]>('/jobs').catch(() => []),
  ]);

  return <ReceiptDetailContent receipt={receipt} jobs={jobs} />;
}
