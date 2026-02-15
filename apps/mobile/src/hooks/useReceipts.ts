import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { receiptsApi } from '../api/receipts';
import type { ReceiptQueryDto, UpdateReceiptDto, SplitLineItemsDto } from '@jobreceipt/shared';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE, RECEIPTS_RECENT_LIMIT } from '../lib/constants';

export const receiptKeys = {
  all: ['receipts'] as const,
  lists: () => [...receiptKeys.all, 'list'] as const,
  list: (params: ReceiptQueryDto) => [...receiptKeys.lists(), params] as const,
  details: () => [...receiptKeys.all, 'detail'] as const,
  detail: (id: string) => [...receiptKeys.details(), id] as const,
  recent: () => [...receiptKeys.all, 'recent'] as const,
};

export function useReceipts(params?: ReceiptQueryDto) {
  return useInfiniteQuery({
    queryKey: receiptKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      receiptsApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useRecentReceipts() {
  return useQuery({
    queryKey: receiptKeys.recent(),
    queryFn: () => receiptsApi.list({ limit: RECEIPTS_RECENT_LIMIT }),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useReceipt(id: string) {
  return useQuery({
    queryKey: receiptKeys.detail(id),
    queryFn: () => receiptsApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateReceiptDto }) =>
      receiptsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(receiptKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
    },
  });
}

export function useApproveReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => receiptsApi.approve(id),
    onSuccess: (data) => {
      queryClient.setQueryData(receiptKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
    },
  });
}

export function useRejectReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => receiptsApi.reject(id),
    onSuccess: (data) => {
      queryClient.setQueryData(receiptKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
    },
  });
}

export function useSplitReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignments }: { id: string; assignments: SplitLineItemsDto }) =>
      receiptsApi.splitLineItems(id, assignments),
    onSuccess: (data) => {
      queryClient.setQueryData(receiptKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
    },
  });
}
