import { apiClient } from './client';
import type {
  JobCloseOut,
  CloseOutChecklistItem,
  CloseOutProgress,
} from '@jobreceipt/shared';

export interface CloseOutWithProgress extends JobCloseOut {
  progress: {
    total: number;
    completed: number;
    waived: number;
    pending: number;
    percent: number;
  };
}

export const closeOutApi = {
  initiate: async (
    jobId: string,
    customItems?: string[],
  ): Promise<JobCloseOut> => {
    const { data } = await apiClient.post('/close-out/initiate', {
      jobId,
      customItems,
    });
    return data;
  },

  getByJob: async (jobId: string): Promise<CloseOutWithProgress> => {
    const { data } = await apiClient.get(`/close-out/job/${jobId}`);
    return data;
  },

  getProgress: async (jobId: string): Promise<CloseOutProgress> => {
    const { data } = await apiClient.get(`/close-out/job/${jobId}/progress`);
    return data;
  },

  updateCloseOut: async (
    id: string,
    updates: {
      walkthroughDate?: string;
      walkthroughNotes?: string;
      customerSignedName?: string;
    },
  ): Promise<JobCloseOut> => {
    const { data } = await apiClient.patch(`/close-out/${id}`, updates);
    return data;
  },

  updateChecklistItem: async (
    itemId: string,
    updates: { status: string; notes?: string },
  ): Promise<CloseOutChecklistItem> => {
    const { data } = await apiClient.patch(
      `/close-out/checklist/${itemId}`,
      updates,
    );
    return data;
  },

  getSignatureUploadUrl: async (
    id: string,
  ): Promise<{ url: string; key: string }> => {
    const { data } = await apiClient.post(
      `/close-out/${id}/signature-upload-url`,
    );
    return data;
  },

  saveSignature: async (
    id: string,
    signatureKey: string,
    customerName: string,
  ): Promise<JobCloseOut> => {
    const { data } = await apiClient.post(`/close-out/${id}/signature`, {
      signatureKey,
      customerName,
    });
    return data;
  },

  complete: async (id: string): Promise<JobCloseOut> => {
    const { data } = await apiClient.post(`/close-out/${id}/complete`);
    return data;
  },
};
