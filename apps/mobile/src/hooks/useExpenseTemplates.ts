import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseTemplatesApi } from '../api/expense-templates';
import { QUERY_STALE_TIME } from '../lib/constants';

export const expenseTemplateKeys = {
  all: ['expense-templates'] as const,
  lists: () => [...expenseTemplateKeys.all, 'list'] as const,
  list: (params: { search?: string }) =>
    [...expenseTemplateKeys.lists(), params] as const,
  details: () => [...expenseTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseTemplateKeys.details(), id] as const,
};

export function useExpenseTemplates(params?: { search?: string }) {
  return useQuery({
    queryKey: expenseTemplateKeys.list(params ?? {}),
    queryFn: () => expenseTemplatesApi.list({ ...params, limit: 100 }),
    staleTime: QUERY_STALE_TIME,
  });
}

export function useExpenseTemplate(id: string) {
  return useQuery({
    queryKey: expenseTemplateKeys.detail(id),
    queryFn: () => expenseTemplatesApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateExpenseTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expenseTemplatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseTemplateKeys.lists() });
    },
  });
}

export function useUpdateExpenseTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof expenseTemplatesApi.update>[1] }) =>
      expenseTemplatesApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(expenseTemplateKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: expenseTemplateKeys.lists() });
    },
  });
}

export function useSaveExpenseAsTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, expenseId }: { name: string; expenseId: string }) =>
      expenseTemplatesApi.saveFromExpense(name, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseTemplateKeys.lists() });
    },
  });
}

export function useDeleteExpenseTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseTemplatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseTemplateKeys.lists() });
    },
  });
}
