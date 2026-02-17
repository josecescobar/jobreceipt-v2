export interface Expense {
  id: string;
  organizationId: string;
  receiptId: string | null;
  jobId: string;
  costCodeId: string | null;
  /** In cents */
  amount: number;
  description: string;
  category: string | null;
  taxCategory: string | null;
  mileage: number | null;
  date: string;
  createdById: string;
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MileageTrip {
  id: string;
  organizationId: string;
  jobId: string;
  userId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distanceMiles: number;
  /** IRS rate in cents per mile */
  irsRate: number;
  /** Total deduction in cents */
  totalDeduction: number;
  date: Date;
  purpose: string | null;
  createdAt: Date;
  updatedAt: Date;
}
