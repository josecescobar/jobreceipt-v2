import { useState, useCallback } from 'react';
import { processImage, ProcessedImage } from '../lib/image';

export function useImageProcessor() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(async (uri: string): Promise<ProcessedImage | null> => {
    setProcessing(true);
    setError(null);
    try {
      const result = await processImage(uri);
      return result;
    } catch (err: any) {
      setError(err.message || 'Image processing failed');
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  return { process, processing, error };
}
