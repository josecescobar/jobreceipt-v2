export enum PunchListItemStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum PunchListItemPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface PunchListPhoto {
  id: string;
  punchListItemId: string;
  imageKey: string;
  caption: string | null;
  uploadedById: string;
  imageUrl?: string;
  createdAt: string;
}

export interface PunchListItem {
  id: string;
  organizationId: string;
  jobId: string;
  title: string;
  description: string | null;
  priority: PunchListItemPriority;
  status: PunchListItemStatus;
  assignedToId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  completedById: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  photos?: PunchListPhoto[];
  job?: { id: string; name: string };
  assignedTo?: { id: string; name: string | null };
  completedBy?: { id: string; name: string | null };
  createdBy?: { id: string; name: string | null };
}

export interface PunchListSummary {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  completionPercent: number;
}
