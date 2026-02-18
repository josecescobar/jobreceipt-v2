export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum MaintenanceType {
  INSPECTION = 'INSPECTION',
  REPAIR = 'REPAIR',
  SERVICING = 'SERVICING',
  CALIBRATION = 'CALIBRATION',
  OTHER = 'OTHER',
}

export interface Equipment {
  id: string;
  organizationId: string;
  name: string;
  type?: string | null;
  make?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  status: EquipmentStatus;
  imageKey?: string | null;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string | null } | null;
  assignments?: EquipmentAssignment[];
  maintenanceLogs?: MaintenanceLog[];
  currentAssignment?: EquipmentAssignment | null;
}

export interface EquipmentAssignment {
  id: string;
  organizationId: string;
  equipmentId: string;
  jobId: string;
  checkedOutAt: string;
  checkedInAt?: string | null;
  checkedOutById: string;
  checkedInById?: string | null;
  notes?: string | null;
  createdAt: string;
  equipment?: { id: string; name: string } | null;
  job?: { id: string; name: string } | null;
  checkedOutBy?: { id: string; name: string | null } | null;
  checkedInBy?: { id: string; name: string | null } | null;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  type: MaintenanceType;
  description?: string | null;
  performedAt: string;
  performedById?: string | null;
  cost?: number | null;
  nextDueDate?: string | null;
  notes?: string | null;
  createdAt: string;
  performedBy?: { id: string; name: string | null } | null;
}

export interface EquipmentSummary {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
  retired: number;
}
