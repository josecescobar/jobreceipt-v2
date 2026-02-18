export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends Customer {
  jobCount: number;
  lifetimeSpending: number;
}
