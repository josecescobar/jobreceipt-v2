export enum UserRole {
  OWNER = 'OWNER',
  BOOKKEEPER = 'BOOKKEEPER',
  CREW = 'CREW',
}

export enum OrgPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  CREW = 'CREW',
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: OrgPlan;
  stripeCustomerId: string | null;
  qbRealmId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  invitedAt: Date;
  acceptedAt: Date | null;
}
