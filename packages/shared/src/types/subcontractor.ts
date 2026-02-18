export interface Subcontractor {
  id: string;
  organizationId: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  trade: string | null;
  licenseNumber: string | null;
  insuranceExpiry: string | null;
  w9Received: boolean;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubcontractorSummary {
  totalPaid: number;
  expenseCount: number;
}
