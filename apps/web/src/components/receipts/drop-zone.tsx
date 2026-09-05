'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelect, disabled }: DropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Please upload a JPEG, PNG, or WebP image.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('File must be under 10MB.');
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSet(file);
    },
    [validateAndSet],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSet(file);
    },
    [validateAndSet],
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative rounded-lg border border-border p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={clearPreview}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Receipt preview"
            className="mx-auto max-h-64 rounded object-contain"
          />
        </div>
      ) : (
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drag & drop a receipt image, or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, or WebP up to 10MB
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
