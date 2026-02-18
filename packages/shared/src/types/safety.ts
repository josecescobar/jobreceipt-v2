export enum SafetyInspectionStatus {
  OPEN = 'OPEN',
  COMPLETE = 'COMPLETE',
}

export enum IncidentType {
  INJURY = 'INJURY',
  NEAR_MISS = 'NEAR_MISS',
  PROPERTY_DAMAGE = 'PROPERTY_DAMAGE',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  OTHER = 'OTHER',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface SafetyInspectionItem {
  id: string;
  inspectionId: string;
  label: string;
  isCompliant: boolean;
  notes: string | null;
  sortOrder: number;
}

export interface SafetyInspection {
  id: string;
  organizationId: string;
  jobId: string;
  templateName: string;
  status: SafetyInspectionStatus;
  completedById: string | null;
  completedAt: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string };
  items?: SafetyInspectionItem[];
  createdBy?: { id: string; name: string | null; email: string };
  completedBy?: { id: string; name: string | null; email: string };
}

export interface SafetyIncidentPhoto {
  id: string;
  incidentId: string;
  imageKey: string;
  caption: string | null;
  uploadedById: string;
  createdAt: string;
  url?: string;
}

export interface SafetyIncident {
  id: string;
  organizationId: string;
  jobId: string;
  reportedById: string;
  incidentDate: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location: string | null;
  witnesses: string | null;
  actionTaken: string | null;
  followUp: string | null;
  status: IncidentStatus;
  resolvedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string };
  photos?: SafetyIncidentPhoto[];
  reportedBy?: { id: string; name: string | null; email: string };
}

export interface SafetyTemplate {
  name: string;
  items: string[];
}

export interface SafetySummary {
  openIncidents: number;
  inspectionsThisMonth: number;
  totalInspections: number;
  totalIncidents: number;
}
