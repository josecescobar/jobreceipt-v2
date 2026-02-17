interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

function escapeField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function generateCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  const headerRow = columns.map((c) => escapeField(c.header)).join(',');
  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const val = col.accessor(row);
        return escapeField(val == null ? '' : String(val));
      })
      .join(','),
  );
  return [headerRow, ...dataRows].join('\n');
}

export type { CsvColumn };
