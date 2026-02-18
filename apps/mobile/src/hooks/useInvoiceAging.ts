import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceAgingApi } from '../api/invoice-aging';
import { useUIStore } from '../stores/ui.store';
import { QUERY_STALE_TIME } from '../lib/constants';

export const invoiceAgingKeys = {
  all: ['invoice-aging'] as const,
  summary: () => [...invoiceAgingKeys.all, 'summary'] as const,
  overdue: (bucket?: string) => [...invoiceAgingKeys.all, 'overdue', bucket] as const,
};

export function useAgingSummary() {
  return useQuery({
    queryKey: invoiceAgingKeys.summary(),
    queryFn: () => invoiceAgingApi.getAgingSummary(),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useOverdueInvoices(bucket?: string) {
  return useQuery({
    queryKey: invoiceAgingKeys.overdue(bucket),
    queryFn: () => invoiceAgingApi.getOverdueInvoices({ bucket }),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useSendReminder() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (invoiceId: string) => invoiceAgingApi.sendReminder(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceAgingKeys.summary() });
      queryClient.invalidateQueries({ queryKey: invoiceAgingKeys.all });
      addToast({
        id: Date.now().toString(),
        message: 'Payment reminder sent',
        type: 'success',
      });
    },
  });
}
