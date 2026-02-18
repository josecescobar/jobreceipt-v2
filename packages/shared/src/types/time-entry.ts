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
  /** Minutes worked beyond regular hours */
  overtimeMinutes: number;
  /** Overtime rate in cents/hr (null = 1.5x hourlyRate) */
  overtimeRate: number | null;
  /** Whether a timer is actively running */
  isRunning: boolean;
  /** Exact clock-in timestamp for active timer */
  clockInAt: string | null;
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
  /** Regular (non-overtime) minutes */
  regularMinutes: number;
  /** Regular cost in cents */
  regularCost: number;
  /** Overtime minutes */
  overtimeMinutes: number;
  /** Overtime cost in cents */
  overtimeCost: number;
}
