import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { receiptsApi } from '../api/receipts';
import { processImage, recompressImage } from '../lib/image';
import { useCameraStore } from '../stores/camera.store';
import { receiptKeys } from './useReceipts';

type UploadStatus = 'idle' | 'processing' | 'uploading' | 'confirming' | 'done' | 'error';

interface UploadState {
  status: UploadStatus;
  receiptId: string | null;
  error: string | null;
}

export function useReceiptUpload() {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    receiptId: null,
    error: null,
  });
  const queryClient = useQueryClient();
  const { addUpload, updateUpload } = useCameraStore();

  const upload = useCallback(async (imageUri: string) => {
    const uploadId = `upload_${Date.now()}`;

    addUpload({
      id: uploadId,
      uri: imageUri,
      status: 'pending',
      createdAt: Date.now(),
    });

    try {
      // Step 1: Process image (resize + compress to JPEG)
      setState({ status: 'processing', receiptId: null, error: null });
      updateUpload(uploadId, { status: 'uploading' });

      const processed = await processImage(imageUri);

      // Step 2: Get upload URL from API
      setState((s) => ({ ...s, status: 'uploading' }));

      const { receiptId, uploadUrl, imageKey } = await receiptsApi.requestUploadUrl(
        `receipt_${Date.now()}.jpg`,
        'image/jpeg',
      );

      // Step 3: Upload to S3
      const response = await fetch(processed.uri);
      const blob = await response.blob();

      try {
        await receiptsApi.uploadToS3(uploadUrl, blob, 'image/jpeg');
      } catch (uploadError: any) {
        // On 413, retry with lower quality
        if (uploadError.status === 413) {
          const recompressed = await recompressImage(imageUri);
          const retryResponse = await fetch(recompressed.uri);
          const retryBlob = await retryResponse.blob();
          await receiptsApi.uploadToS3(uploadUrl, retryBlob, 'image/jpeg');
        } else {
          throw uploadError;
        }
      }

      // Step 4: Confirm upload (triggers OCR)
      setState((s) => ({ ...s, status: 'confirming' }));
      updateUpload(uploadId, { status: 'confirming', receiptId });

      await receiptsApi.confirmUpload(imageKey);

      // Done
      setState({ status: 'done', receiptId, error: null });
      updateUpload(uploadId, { status: 'done', receiptId });

      // Invalidate receipt queries to show new receipt
      queryClient.invalidateQueries({ queryKey: receiptKeys.all });

      return receiptId;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
      setState({ status: 'error', receiptId: null, error: errorMsg });
      updateUpload(uploadId, { status: 'error', error: errorMsg });
      throw err;
    }
  }, [queryClient, addUpload, updateUpload]);

  const reset = useCallback(() => {
    setState({ status: 'idle', receiptId: null, error: null });
  }, []);

  return {
    ...state,
    upload,
    reset,
    isUploading: state.status !== 'idle' && state.status !== 'done' && state.status !== 'error',
  };
}
