import { formatMoney } from '@/lib/money';

export interface CsvColumn {
  key: string;
  header: string;
  formatter?: (val: unknown) => string;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(val: unknown): string {
  if (!val) return '';
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return String(val);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatCents(val: unknown): string {
  if (val == null) return '$0.00';
  return formatMoney(val as number);
}

function formatConfidence(val: unknown): string {
  if (val == null) return '';
  return `${((val as number) * 100).toFixed(0)}%`;
}

export const csvFormatters = {
  date: formatDate,
  money: formatCents,
  confidence: formatConfidence,
};

export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns: CsvColumn[],
): void {
  if (data.length === 0) return;

  const headerRow = columns.map((col) => escapeCSV(col.header)).join(',');

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const raw = row[col.key];
        const formatted = col.formatter ? col.formatter(raw) : String(raw ?? '');
        return escapeCSV(formatted);
      })
      .join(','),
  );

  const csv = [headerRow, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
