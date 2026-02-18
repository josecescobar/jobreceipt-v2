export enum DrawRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
}

export interface ScheduleOfValues {
  id: string;
  organizationId: string;
  jobId: string;
  retainagePercent: number;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string; contractValue?: number | null };
  items?: ScheduleOfValuesItem[];
  drawRequests?: DrawRequest[];
  createdBy?: { id: string; name: string; email: string };
}

export interface ScheduleOfValuesItem {
  id: string;
  scheduleId: string;
  itemNumber: string;
  description: string;
  scheduledValue: number;
  costCodeId?: string | null;
  sortOrder: number;
}

export interface DrawRequest {
  id: string;
  scheduleId: string;
  organizationId: string;
  applicationNumber: number;
  periodTo: string;
  invoiceId?: string | null;
  status: DrawRequestStatus;
  totalEarned: number;
  totalRetainage: number;
  totalPreviouslyBilled: number;
  currentPaymentDue: number;
  notes?: string | null;
  createdById: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  entries?: DrawRequestEntry[];
  createdBy?: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string; email: string };
  schedule?: ScheduleOfValues;
}

export interface DrawRequestEntry {
  id: string;
  drawRequestId: string;
  sovItemId: string;
  workCompletedPrevious: number;
  workCompletedThisPeriod: number;
  materialsStored: number;
  totalCompletedAndStored: number;
  percentComplete: number;
  balanceToFinish: number;
  retainage: number;
  sovItem?: ScheduleOfValuesItem;
}

export interface ProgressBillingSummary {
  totalScheduledValue: number;
  totalEarned: number;
  totalRetainage: number;
  totalBilled: number;
  remainingValue: number;
  percentComplete: number;
}
