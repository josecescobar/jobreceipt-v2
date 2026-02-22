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

async function uploadWithRetry(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
  maxRetries = 2,
): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await receiptsApi.uploadToS3(uploadUrl, blob, contentType);
      return;
    } catch (err: any) {
      // Don't retry client errors (4xx)
      if (err.status && err.status >= 400 && err.status < 500) throw err;
      // Last attempt — rethrow
      if (attempt === maxRetries) throw err;
      // Wait before retry (exponential backoff)
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

function friendlyError(err: any): string {
  if (err.status === 413) return 'Image is too large. Please try a smaller photo.';
  if (err.status >= 500) return 'Server error. Please try again in a moment.';
  if (!err.response && !err.status) return 'No internet connection. Check your network and try again.';
  return err.response?.data?.message || err.message || 'Upload failed. Please try again.';
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

      // Step 3: Upload to S3 with retry
      const response = await fetch(processed.uri);
      const blob = await response.blob();

      try {
        await uploadWithRetry(uploadUrl, blob, 'image/jpeg');
      } catch (uploadError: any) {
        // On 413, retry with lower quality
        if (uploadError.status === 413) {
          const recompressed = await recompressImage(imageUri);
          const retryResponse = await fetch(recompressed.uri);
          const retryBlob = await retryResponse.blob();
          await uploadWithRetry(uploadUrl, retryBlob, 'image/jpeg', 1);
        } else {
          throw uploadError;
        }
      }

      // Step 4: Confirm upload (triggers OCR)
      setState((s) => ({ ...s, status: 'confirming' }));
      updateUpload(uploadId, { status: 'confirming', receiptId });

      await receiptsApi.confirmUpload(receiptId, imageKey);

      // Done
      setState({ status: 'done', receiptId, error: null });
      updateUpload(uploadId, { status: 'done', receiptId });

      // Invalidate receipt queries to show new receipt
      queryClient.invalidateQueries({ queryKey: receiptKeys.all });

      return receiptId;
    } catch (err: any) {
      const errorMsg = friendlyError(err);
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
