import { getServerApiClient } from '@/lib/api/server';
import type { Receipt, PaginatedResponse } from '@/lib/api/types';
import { DashboardContent } from './dashboard-content';

export default async function DashboardPage() {
  const api = await getServerApiClient();

  const receiptsRes = await api.get<PaginatedResponse<Receipt>>('/receipts?limit=100').catch(() => ({ data: [] }));

  return <DashboardContent receipts={receiptsRes.data} />;
}
