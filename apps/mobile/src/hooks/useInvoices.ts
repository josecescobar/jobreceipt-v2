import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices';
import { QUERY_STALE_TIME } from '../lib/constants';

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (params: { jobId?: string; status?: string }) =>
    [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export function useInvoices(params?: { jobId?: string; status?: string }) {
  return useQuery({
    queryKey: invoiceKeys.list(params ?? {}),
    queryFn: () => invoicesApi.list({ ...params, limit: 100 }),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invoicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof invoicesApi.update>[1] }) =>
      invoicesApi.update(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(invoiceKeys.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useUnpaidInvoiceSummary() {
  const { data: draftData, isLoading: draftLoading } = useInvoices({ status: 'DRAFT' });
  const { data: sentData, isLoading: sentLoading } = useInvoices({ status: 'SENT' });
  const { data: partialData, isLoading: partialLoading } = useInvoices({ status: 'PARTIALLY_PAID' });

  const drafts = (draftData as any)?.data ?? [];
  const sents = (sentData as any)?.data ?? [];
  const partials = (partialData as any)?.data ?? [];
  const all = [...drafts, ...sents, ...partials];
  const count = all.length;
  const total = all.reduce(
    (sum: number, inv: any) => sum + ((inv.total ?? 0) - (inv.paidAmount ?? 0)),
    0,
  );

  return { count, total, isLoading: draftLoading || sentLoading || partialLoading };
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      payment,
    }: {
      invoiceId: string;
      payment: Parameters<typeof invoicesApi.addPayment>[1];
    }) => invoicesApi.addPayment(invoiceId, payment),
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(invoiceKeys.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useRemovePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      paymentId,
    }: {
      invoiceId: string;
      paymentId: string;
    }) => invoicesApi.removePayment(invoiceId, paymentId),
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(invoiceKeys.detail(data.id), data);
      }
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useGenerateInvoiceShareLink() {
  return useMutation({
    mutationFn: (id: string) => invoicesApi.generateShareLink(id),
  });
}
