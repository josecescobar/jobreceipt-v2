export type ReportType =
  | 'job_summary'
  | 'profitability'
  | 'labor_hours'
  | 'expense_detail'
  | 'tax_deductions';

export interface ReportConfig {
  type: ReportType;
  title: string;
  dateRange: { start: string; end: string };
  jobIds?: string[];
  categories?: string[];
  crewUserIds?: string[];
  format: 'pdf' | 'csv';
}

export interface ReportTemplate {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
}
