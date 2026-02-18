import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { documentsApi } from '../api/documents';
import type { CreateDocumentInput, UpdateDocumentInput, DocumentQuery } from '../api/documents';
import { QUERY_STALE_TIME, DEFAULT_PAGE_SIZE } from '../lib/constants';

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params: DocumentQuery) => [...documentKeys.lists(), params] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

export function useDocuments(params?: DocumentQuery) {
  return useInfiniteQuery({
    queryKey: documentKeys.list(params ?? {}),
    queryFn: ({ pageParam = 1 }) =>
      documentsApi.list({ ...params, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / DEFAULT_PAGE_SIZE);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsApi.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      fileName: string;
      contentType: string;
      fileUri: string;
      fileSize: number;
      name: string;
      type?: string;
      jobId?: string;
      vendorId?: string;
      subcontractorId?: string;
      expiresAt?: string;
      notes?: string;
    }) => {
      // 1) Get pre-signed upload URL
      const { uploadUrl, fileKey } = await documentsApi.requestUploadUrl(
        input.fileName,
        input.contentType,
      );

      // 2) Upload file to S3
      const fileResponse = await fetch(input.fileUri);
      const blob = await fileResponse.blob();
      await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': input.contentType },
      });

      // 3) Create document record
      return documentsApi.create({
        name: input.name,
        type: input.type,
        fileKey,
        fileType: input.contentType,
        fileSize: input.fileSize,
        jobId: input.jobId,
        vendorId: input.vendorId,
        subcontractorId: input.subcontractorId,
        expiresAt: input.expiresAt,
        notes: input.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateDocumentInput }) =>
      documentsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(documentKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}
