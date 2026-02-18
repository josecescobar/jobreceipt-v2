export enum WarrantyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  CLAIMED = 'CLAIMED',
}

export enum WarrantyClaimStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  DENIED = 'DENIED',
}

export interface Warranty {
  id: string;
  organizationId: string;
  jobId: string;
  title: string;
  description?: string | null;
  manufacturer?: string | null;
  warrantyProvider?: string | null;
  startDate: string;
  endDate: string;
  status: WarrantyStatus;
  contactPhone?: string | null;
  contactEmail?: string | null;
  documentId?: string | null;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string } | null;
  claims?: WarrantyClaim[];
  createdBy?: { id: string; name: string | null; email: string } | null;
}

export interface WarrantyClaim {
  id: string;
  warrantyId: string;
  claimDate: string;
  description: string;
  status: WarrantyClaimStatus;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantySummary {
  active: number;
  expiringSoon: number;
  expired: number;
  claimed: number;
  total: number;
}
