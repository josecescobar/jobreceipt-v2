export enum CloseOutChecklistItemStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  WAIVED = 'WAIVED',
}

export interface JobCloseOut {
  id: string;
  jobId: string;
  organizationId: string;
  initiatedById: string;
  initiatedAt: string;
  completedAt?: string | null;
  customerSignature?: string | null;
  customerSignedAt?: string | null;
  customerSignedName?: string | null;
  walkthroughDate?: string | null;
  walkthroughNotes?: string | null;
  walkthroughPhotos?: string[] | null;
  punchListCleared: boolean;
  invoicesPaid: boolean;
  documentsComplete: boolean;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string } | null;
  initiatedBy?: { id: string; name: string | null } | null;
  checklistItems?: CloseOutChecklistItem[];
}

export interface CloseOutChecklistItem {
  id: string;
  closeOutId: string;
  label: string;
  status: CloseOutChecklistItemStatus;
  completedAt?: string | null;
  completedById?: string | null;
  notes?: string | null;
  sortOrder: number;
  createdAt: string;
  completedBy?: { id: string; name: string | null } | null;
}

export interface CloseOutProgress {
  total: number;
  completed: number;
  waived: number;
  pending: number;
  percent: number;
  isComplete: boolean;
}
