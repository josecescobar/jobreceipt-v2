import { apiClient } from './client';
import type { Receipt, ReceiptLineItem, ReceiptQueryDto, UpdateReceiptDto, SplitLineItemsDto, CreateLineItemDto, UpdateLineItemDto } from '@jobreceipt/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface UploadUrlResponse {
  receiptId: string;
  uploadUrl: string;
  imageKey: string;
}

export const receiptsApi = {
  list: async (params?: ReceiptQueryDto): Promise<PaginatedResponse<Receipt>> => {
    const { data } = await apiClient.get('/receipts', { params });
    return data;
  },

  getById: async (id: string): Promise<Receipt> => {
    const { data } = await apiClient.get(`/receipts/${id}`);
    return data;
  },

  requestUploadUrl: async (fileName: string, contentType: string): Promise<UploadUrlResponse> => {
    const { data } = await apiClient.post('/receipts/upload', { fileName, contentType });
    return data;
  },

  uploadToS3: async (uploadUrl: string, file: Blob | ArrayBuffer, contentType: string): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    if (!response.ok) {
      const err: any = new Error(`S3 upload failed (${response.status})`);
      err.status = response.status;
      throw err;
    }
  },

  confirmUpload: async (imageKey: string): Promise<Receipt> => {
    const { data } = await apiClient.post('/receipts/upload/confirm', { imageKey });
    return data;
  },

  update: async (id: string, updates: UpdateReceiptDto): Promise<Receipt> => {
    const { data } = await apiClient.patch(`/receipts/${id}`, updates);
    return data;
  },

  splitLineItems: async (id: string, assignments: SplitLineItemsDto): Promise<Receipt> => {
    const { data } = await apiClient.patch(`/receipts/${id}/split`, assignments);
    return data;
  },

  approve: async (id: string): Promise<Receipt> => {
    const { data } = await apiClient.patch(`/receipts/${id}`, { status: 'APPROVED' });
    return data;
  },

  reject: async (id: string): Promise<Receipt> => {
    const { data } = await apiClient.patch(`/receipts/${id}`, { status: 'REJECTED' });
    return data;
  },

  createLineItem: async (receiptId: string, data: CreateLineItemDto): Promise<ReceiptLineItem> => {
    const { data: result } = await apiClient.post(`/receipts/${receiptId}/line-items`, data);
    return result;
  },

  updateLineItem: async (receiptId: string, lineItemId: string, data: UpdateLineItemDto): Promise<ReceiptLineItem> => {
    const { data: result } = await apiClient.patch(`/receipts/${receiptId}/line-items/${lineItemId}`, data);
    return result;
  },

  deleteLineItem: async (receiptId: string, lineItemId: string): Promise<void> => {
    await apiClient.delete(`/receipts/${receiptId}/line-items/${lineItemId}`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/receipts/${id}`);
  },
};
