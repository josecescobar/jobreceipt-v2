'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useApiClient } from '@/lib/api/hooks';
import type { UploadResponse } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropZone } from '@/components/receipts/drop-zone';

type UploadState =
  | { step: 'idle' }
  | { step: 'requesting' }
  | { step: 'uploading' }
  | { step: 'processing' }
  | { step: 'done' }
  | { step: 'error'; message: string };

const STEPS = [
  { key: 'requesting', label: 'Creating receipt...' },
  { key: 'uploading', label: 'Uploading image...' },
  { key: 'processing', label: 'Starting OCR...' },
] as const;

export default function UploadPage() {
  const router = useRouter();
  const api = useApiClient();
  const [state, setState] = useState<UploadState>({ step: 'idle' });

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setState({ step: 'requesting' });
        const { receiptId, uploadUrl } = await api.post<UploadResponse>(
          '/receipts/upload',
          { fileName: file.name, contentType: file.type },
        );

        setState({ step: 'uploading' });
        const uploadRes = await api.put(uploadUrl, file, file.type);
        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.statusText}`);
        }

        setState({ step: 'processing' });
        await api.post(`/receipts/${receiptId}/process`);

        setState({ step: 'done' });
        router.push(`/receipts/${receiptId}`);
      } catch (err) {
        setState({
          step: 'error',
          message: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    },
    [api, router],
  );

  const isUploading = state.step !== 'idle' && state.step !== 'error';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Upload Receipt</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receipt Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DropZone onFileSelect={handleUpload} disabled={isUploading} />

          {state.step !== 'idle' && (
            <div className="space-y-2 rounded-md border border-border p-4">
              {STEPS.map(({ key, label }) => {
                const isActive = state.step === key;
                const isDone =
                  STEPS.findIndex((s) => s.key === state.step) >
                    STEPS.findIndex((s) => s.key === key) ||
                  state.step === 'done';
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    {isActive && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {isDone && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {!isActive && !isDone && (
                      <div className="h-4 w-4 rounded-full border border-border" />
                    )}
                    <span
                      className={
                        isActive
                          ? 'font-medium'
                          : isDone
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground/50'
                      }
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {state.step === 'error' && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Upload failed</p>
                <p>{state.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setState({ step: 'idle' })}
                >
                  Try again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
