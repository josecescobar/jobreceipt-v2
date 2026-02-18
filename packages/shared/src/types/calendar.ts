export type CalendarEventType = 'expense' | 'time_entry' | 'mileage' | 'invoice_due' | 'recurring_expense';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string;
  title: string;
  amount?: number;
}

export interface CalendarData {
  days: Record<string, CalendarEvent[]>;
  summary: Record<CalendarEventType, number>;
}
