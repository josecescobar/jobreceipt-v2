export enum UserRole {
  OWNER = 'OWNER',
  BOOKKEEPER = 'BOOKKEEPER',
  CREW = 'CREW',
}

export enum PlanTier {
  FREE = 'FREE',
  PRO = 'PRO',
  CREW = 'CREW',
}

export enum JobStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum ReceiptStatus {
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum CostCodeCategory {
  MATERIALS = 'MATERIALS',
  LABOR = 'LABOR',
  EQUIPMENT = 'EQUIPMENT',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  OVERHEAD = 'OVERHEAD',
}
