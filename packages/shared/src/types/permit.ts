export enum PermitType {
  BUILDING = 'BUILDING',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  MECHANICAL = 'MECHANICAL',
  FIRE = 'FIRE',
  DEMOLITION = 'DEMOLITION',
  GRADING = 'GRADING',
  OTHER = 'OTHER',
}

export enum PermitStatus {
  APPLIED = 'APPLIED',
  ISSUED = 'ISSUED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  CLOSED = 'CLOSED',
}

export enum InspectionResult {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
  PENDING = 'PENDING',
}

export interface Permit {
  id: string;
  organizationId: string;
  jobId: string;
  permitNumber?: string | null;
  type: PermitType;
  status: PermitStatus;
  appliedDate?: string | null;
  issuedDate?: string | null;
  expiresAt?: string | null;
  authority?: string | null;
  fee?: number | null;
  documentId?: string | null;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string } | null;
  inspections?: PermitInspection[];
  createdBy?: { id: string; name: string | null; email: string } | null;
}

export interface PermitInspection {
  id: string;
  permitId: string;
  scheduledDate: string;
  completedDate?: string | null;
  result: InspectionResult;
  inspector?: string | null;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermitSummary {
  applied: number;
  issued: number;
  expired: number;
  total: number;
}
