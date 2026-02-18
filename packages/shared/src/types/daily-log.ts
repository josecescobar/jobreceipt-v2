export enum WeatherCondition {
  SUNNY = 'SUNNY',
  CLOUDY = 'CLOUDY',
  RAINY = 'RAINY',
  SNOWY = 'SNOWY',
  WINDY = 'WINDY',
}

export interface DailyLogPhoto {
  id: string;
  dailyLogId: string;
  imageKey: string;
  caption: string | null;
  uploadedById: string;
  imageUrl?: string;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  organizationId: string;
  jobId: string;
  userId: string;
  date: string;
  weather: WeatherCondition | null;
  temperature: number | null;
  crewCount: number | null;
  workPerformed: string;
  materialsUsed: string | null;
  safetyNotes: string | null;
  hoursWorked: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  photos?: DailyLogPhoto[];
  job?: { id: string; name: string };
  user?: { id: string; name: string | null };
}
