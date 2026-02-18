export interface TimeEntry {
  id: string;
  organizationId: string;
  jobId: string;
  userId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  /** Total minutes worked */
  durationMinutes: number;
  /** Hourly rate in cents */
  hourlyRate: number;
  /** Pre-computed total cost in cents */
  totalCost: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  job?: { id: string; name: string };
  user?: { id: string; name: string; email: string };
}

export interface TimeEntrySummary {
  totalEntries: number;
  totalMinutes: number;
  /** In cents */
  totalCost: number;
}
