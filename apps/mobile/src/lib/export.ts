import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { receiptsApi } from '../api/receipts';
import { expensesApi } from '../api/expenses';
import { mileageApi } from '../api/mileage';
import { analyticsApi } from '../api/analytics';
import { getAuthHeaders } from '../api/client';
import { API_BASE_URL } from './constants';
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

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
}

export async function exportJobReport(jobId: string, jobName: string): Promise<void> {
  const [expRes, recRes, milRes] = await Promise.all([
    expensesApi.list({ jobId, limit: EXPORT_LIMIT } as any),
    receiptsApi.list({ jobId, limit: EXPORT_LIMIT } as any),
    mileageApi.list({ jobId, limit: EXPORT_LIMIT }),
  ]);

  if (expRes.data.length === 0 && recRes.data.length === 0 && milRes.data.length === 0) {
    throw new Error('No data to export for this job.');
  }

  const lines: string[] = [];

  // Job header
  lines.push(`Job Report: ${jobName}`);
  lines.push(`Generated: ${today()}`);
  lines.push('');

  // Expenses section
  lines.push('EXPENSES');
  if (expRes.data.length > 0) {
    const expCsv = generateCsv(expRes.data, [
      { header: 'Date', accessor: (r: any) => r.date?.split('T')[0] ?? '' },
      { header: 'Description', accessor: (r: any) => r.description ?? '' },
      { header: 'Amount', accessor: (r: any) => r.amount != null ? centsToDollars(r.amount) : '' },
      { header: 'Category', accessor: (r: any) => r.category ?? '' },
    ]);
    lines.push(expCsv);
  } else {
    lines.push('No expenses for this job');
  }
  lines.push('');

  // Receipts section
  lines.push('RECEIPTS');
  if (recRes.data.length > 0) {
    const recCsv = generateCsv(recRes.data, [
      { header: 'Date', accessor: (r: any) => r.transactionDate?.split('T')[0] ?? '' },
      { header: 'Merchant', accessor: (r: any) => r.merchantName ?? '' },
      { header: 'Total', accessor: (r: any) => r.totalAmount != null ? centsToDollars(r.totalAmount) : '' },
      { header: 'Status', accessor: (r: any) => r.status ?? '' },
    ]);
    lines.push(recCsv);
  } else {
    lines.push('No receipts for this job');
  }
  lines.push('');

  // Mileage section
  lines.push('MILEAGE');
  if (milRes.data.length > 0) {
    const milCsv = generateCsv(milRes.data, [
      { header: 'Date', accessor: (r) => r.date?.split('T')[0] ?? '' },
      { header: 'Miles', accessor: (r) => r.distanceMiles },
      { header: 'Rate ($/mi)', accessor: (r) => centsToDollars(r.irsRate) },
      { header: 'Deduction', accessor: (r) => centsToDollars(r.totalDeduction) },
      { header: 'Purpose', accessor: (r) => r.purpose ?? '' },
    ]);
    lines.push(milCsv);
  } else {
    lines.push('No mileage trips for this job');
  }
  lines.push('');

  // Summary
  const totalExpenses = expRes.data.reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0);
  const totalMileage = milRes.data.reduce((sum, m) => sum + m.totalDeduction, 0);

  lines.push('SUMMARY');
  lines.push(`Total Expenses,$${centsToDollars(totalExpenses)}`);
  lines.push(`Total Mileage Deductions,$${centsToDollars(totalMileage)}`);
  lines.push(`Grand Total,$${centsToDollars(totalExpenses + totalMileage)}`);

  const safeName = sanitizeFilename(jobName);
  await shareFile(`${safeName}_${today()}.csv`, lines.join('\n'));
}

export async function exportJobReportPdf(jobId: string, jobName: string): Promise<void> {
  const headers = await getAuthHeaders();
  const safeName = sanitizeFilename(jobName);
  const filename = `${safeName}_report_${today()}.pdf`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  const result = await FileSystem.downloadAsync(
    `${API_BASE_URL}/api/jobs/${jobId}/report`,
    fileUri,
    { headers },
  );

  if (result.status !== 200) {
    throw new Error('Failed to download report.');
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/pdf',
    dialogTitle: `Job Report: ${jobName}`,
    UTI: 'com.adobe.pdf',
  });
}

export async function exportInvoicePdf(invoiceId: string, invoiceNumber: string): Promise<void> {
  const headers = await getAuthHeaders();
  const filename = `${invoiceNumber}_${today()}.pdf`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  const result = await FileSystem.downloadAsync(
    `${API_BASE_URL}/api/invoices/${invoiceId}/pdf`,
    fileUri,
    { headers },
  );

  if (result.status !== 200) {
    throw new Error('Failed to download invoice PDF.');
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/pdf',
    dialogTitle: `Invoice ${invoiceNumber}`,
    UTI: 'com.adobe.pdf',
  });
}

export async function exportEstimatePdf(estimateId: string, estimateNumber: string): Promise<void> {
  const headers = await getAuthHeaders();
  const filename = `${estimateNumber}_${today()}.pdf`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  const result = await FileSystem.downloadAsync(
    `${API_BASE_URL}/api/estimates/${estimateId}/pdf`,
    fileUri,
    { headers },
  );

  if (result.status !== 200) {
    throw new Error('Failed to download estimate PDF.');
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/pdf',
    dialogTitle: `Estimate ${estimateNumber}`,
    UTI: 'com.adobe.pdf',
  });
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

export async function exportTaxSummary(year: number): Promise<void> {
  const summary = await analyticsApi.getTaxSummary(year);

  const lines: string[] = [];

  lines.push(`Tax Summary — ${year}`);
  lines.push(`Generated: ${today()}`);
  lines.push('');

  // Schedule C breakdown
  lines.push('SCHEDULE C DEDUCTIONS');
  if (summary.taxCategoryBreakdown.length > 0) {
    const catCsv = generateCsv(summary.taxCategoryBreakdown, [
      { header: 'Schedule C Line', accessor: (r) => r.scheduleLine },
      { header: 'Category', accessor: (r) => r.name },
      { header: 'Amount', accessor: (r) => centsToDollars(r.total) },
      { header: 'Count', accessor: (r) => r.count },
    ]);
    lines.push(catCsv);
  } else {
    lines.push('No categorized expenses');
  }
  lines.push('');

  // Mileage
  lines.push('MILEAGE DEDUCTION');
  lines.push(`Total Miles,${summary.mileage.totalMiles}`);
  lines.push(`IRS Rate ($/mi),${summary.mileage.ratePerMile}`);
  lines.push(`Total Deduction,$${centsToDollars(summary.mileage.totalDeduction)}`);
  lines.push('');

  // Totals
  lines.push('TOTALS');
  lines.push(`Total Expense Deductions,$${centsToDollars(summary.totals.totalExpenseDeductions)}`);
  lines.push(`Total Mileage Deductions,$${centsToDollars(summary.totals.totalMileageDeductions)}`);
  lines.push(`Grand Total,$${centsToDollars(summary.totals.grandTotal)}`);
  lines.push(`Estimated SE Tax Savings,$${centsToDollars(summary.totals.estimatedSETaxSavings)}`);

  await shareFile(`tax_summary_${year}.csv`, lines.join('\n'));
}
