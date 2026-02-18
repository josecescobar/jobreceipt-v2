export enum DocumentType {
  CONTRACT = 'CONTRACT',
  PERMIT = 'PERMIT',
  INSURANCE = 'INSURANCE',
  LIEN_WAIVER = 'LIEN_WAIVER',
  W9 = 'W9',
  OTHER = 'OTHER',
}

export interface Document {
  id: string;
  organizationId: string;
  name: string;
  type: DocumentType;
  fileKey: string;
  fileType: string;
  fileSize: number;
  jobId: string | null;
  vendorId: string | null;
  subcontractorId: string | null;
  expiresAt: string | null;
  notes: string | null;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
}
