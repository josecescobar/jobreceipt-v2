import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { customersApi } from '../api/customers';
import type { CreateCustomerInput, UpdateCustomerInput, CustomerQuery } from '../api/customers';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: CustomerQuery) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  jobs: (id: string) => [...customerKeys.all, 'jobs', id] as const,
};

export function useCustomers(params?: CustomerQuery) {
  return useInfiniteQuery({
    queryKey: customerKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      customersApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCustomerJobs(id: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: customerKeys.jobs(id),
    queryFn: () => customersApi.getJobs(id, { page, limit }),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => customersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateCustomerInput }) =>
      customersApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}
