export enum CrewAssignmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export interface CrewAssignment {
  id: string;
  organizationId: string;
  jobId: string;
  userId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  status: CrewAssignmentStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string };
  user?: { id: string; name: string | null };
}
