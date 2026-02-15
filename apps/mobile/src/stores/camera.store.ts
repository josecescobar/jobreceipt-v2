import { create } from 'zustand';

export interface PendingUpload {
  id: string;
  uri: string;
  status: 'pending' | 'uploading' | 'confirming' | 'done' | 'error';
  receiptId?: string;
  error?: string;
  createdAt: number;
}

interface CameraState {
  pendingUploads: PendingUpload[];
  addUpload: (upload: PendingUpload) => void;
  updateUpload: (id: string, updates: Partial<PendingUpload>) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  pendingUploads: [],
  addUpload: (upload) =>
    set((state) => ({
      pendingUploads: [...state.pendingUploads, upload],
    })),
  updateUpload: (id, updates) =>
    set((state) => ({
      pendingUploads: state.pendingUploads.map((u) =>
        u.id === id ? { ...u, ...updates } : u,
      ),
    })),
  removeUpload: (id) =>
    set((state) => ({
      pendingUploads: state.pendingUploads.filter((u) => u.id !== id),
    })),
  clearCompleted: () =>
    set((state) => ({
      pendingUploads: state.pendingUploads.filter((u) => u.status !== 'done'),
    })),
}));
