export enum JobStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum CostCodeCategory {
  MATERIALS = 'MATERIALS',
  LABOR = 'LABOR',
  EQUIPMENT = 'EQUIPMENT',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  OVERHEAD = 'OVERHEAD',
}

export interface Job {
  id: string;
  organizationId: string;
  name: string;
  customerId: string | null;
  customerName: string | null;
  customerAddress: string | null;
  customerLat: number | null;
  customerLng: number | null;
  status: JobStatus;
  /** Budget amounts in cents */
  budgetTotal: number | null;
  budgetMaterials: number | null;
  budgetLabor: number | null;
  /** Contract value / revenue in cents */
  contractValue: number | null;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostCode {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  category: CostCodeCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobPhoto {
  id: string;
  jobId: string;
  imageKey: string;
  caption: string | null;
  uploadedById: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  materialsBudget: number;
  materialsSpent: number;
  laborBudget: number;
  laborSpent: number;
  byCategory: Record<CostCodeCategory, { budget: number; spent: number }>;
}
