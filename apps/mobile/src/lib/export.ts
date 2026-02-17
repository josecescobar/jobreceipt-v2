import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { receiptsApi } from '../api/receipts';
import { expensesApi } from '../api/expenses';
import { mileageApi } from '../api/mileage';
import { generateCsv } from './csv';
import { centsToDollars } from './format';

const EXPORT_LIMIT = 10000;

function today(): string {
  return new Date().toISOString().split('T')[0];
}

async function shareFile(filename: string, csvContent: string): Promise<void> {
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: `Export ${filename}`,
    UTI: 'public.comma-separated-values-text',
  });
}

export async function exportReceipts(): Promise<void> {
  const res = await receiptsApi.list({ limit: EXPORT_LIMIT } as any);
  if (res.data.length === 0) throw new Error('No receipts to export.');

  const csv = generateCsv(res.data, [
    { header: 'Date', accessor: (r: any) => r.transactionDate?.split('T')[0] ?? '' },
    { header: 'Merchant', accessor: (r: any) => r.merchantName ?? '' },
    { header: 'Subtotal', accessor: (r: any) => r.subtotalCents != null ? centsToDollars(r.subtotalCents) : '' },
    { header: 'Tax', accessor: (r: any) => r.taxCents != null ? centsToDollars(r.taxCents) : '' },
    { header: 'Total', accessor: (r: any) => r.totalCents != null ? centsToDollars(r.totalCents) : '' },
    { header: 'Status', accessor: (r: any) => r.status ?? '' },
    { header: 'Created At', accessor: (r: any) => r.createdAt?.split('T')[0] ?? '' },
  ]);

  await shareFile(`receipts_${today()}.csv`, csv);
}

export async function exportExpenses(): Promise<void> {
  const res = await expensesApi.list({ limit: EXPORT_LIMIT } as any);
  if (res.data.length === 0) throw new Error('No expenses to export.');

  const csv = generateCsv(res.data, [
    { header: 'Date', accessor: (r: any) => r.date?.split('T')[0] ?? '' },
    { header: 'Description', accessor: (r: any) => r.description ?? '' },
    { header: 'Amount', accessor: (r: any) => r.amountCents != null ? centsToDollars(r.amountCents) : '' },
    { header: 'Category', accessor: (r: any) => r.category ?? '' },
    { header: 'Tax Category', accessor: (r: any) => r.taxCategory ?? '' },
    { header: 'Job ID', accessor: (r: any) => r.jobId ?? '' },
    { header: 'Created At', accessor: (r: any) => r.createdAt?.split('T')[0] ?? '' },
  ]);

  await shareFile(`expenses_${today()}.csv`, csv);
}

export async function exportMileage(): Promise<void> {
  const res = await mileageApi.list({ limit: EXPORT_LIMIT });
  if (res.data.length === 0) throw new Error('No mileage trips to export.');

  const csv = generateCsv(res.data, [
    { header: 'Date', accessor: (r) => r.date?.split('T')[0] ?? '' },
    { header: 'Miles', accessor: (r) => r.distanceMiles },
    { header: 'IRS Rate ($/mi)', accessor: (r) => centsToDollars(r.irsRate) },
    { header: 'Deduction', accessor: (r) => centsToDollars(r.totalDeduction) },
    { header: 'Purpose', accessor: (r) => r.purpose ?? '' },
    { header: 'Job', accessor: (r) => r.job?.name ?? '' },
    { header: 'Created At', accessor: (r) => r.createdAt?.split('T')[0] ?? '' },
  ]);

  await shareFile(`mileage_${today()}.csv`, csv);
}
