import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';

interface ReportOutput {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

interface ColumnDef {
  header: string;
  key: string;
  align?: 'left' | 'right';
  format?: (value: any) => string;
  width?: number;
}

@Injectable()
export class ReportGeneratorService {
  constructor(private reportsService: ReportsService) {}

  async generate(orgId: string, config: GenerateReportDto): Promise<ReportOutput> {
    const data = await this.fetchData(orgId, config);
    const columns = this.getColumns(config.type);

    if (config.format === 'csv') {
      return this.generateCsv(data, columns, config);
    }
    return this.generatePdf(data, columns, config);
  }

  private async fetchData(orgId: string, config: GenerateReportDto): Promise<any[]> {
    const reportConfig = {
      dateRange: config.dateRange,
      jobIds: config.jobIds,
      categories: config.categories,
      crewUserIds: config.crewUserIds,
    };

    switch (config.type) {
      case 'job_summary':
        return this.reportsService.getJobSummaryData(orgId, reportConfig);
      case 'profitability':
        return this.reportsService.getProfitabilityData(orgId, reportConfig);
      case 'labor_hours':
        return this.reportsService.getLaborHoursData(orgId, reportConfig);
      case 'expense_detail':
        return this.reportsService.getExpenseDetailData(orgId, reportConfig);
      case 'tax_deductions':
        return this.reportsService.getTaxDeductionsData(orgId, reportConfig);
      default:
        return [];
    }
  }

  private getColumns(type: string): ColumnDef[] {
    switch (type) {
      case 'job_summary':
        return [
          { header: 'Job', key: 'jobName', align: 'left', width: 160 },
          { header: 'Expenses', key: 'totalExpenses', align: 'right', format: this.formatMoney, width: 90 },
          { header: 'Labor Hours', key: 'laborHours', align: 'right', format: (v) => v.toFixed(1), width: 80 },
          { header: 'Labor Cost', key: 'laborCost', align: 'right', format: this.formatMoney, width: 90 },
          { header: 'Materials', key: 'materialCost', align: 'right', format: this.formatMoney, width: 90 },
          { header: 'Budget', key: 'budget', align: 'right', format: this.formatMoney, width: 90 },
          { header: 'Budget Used %', key: 'budgetUsedPct', align: 'right', format: (v) => `${v.toFixed(1)}%`, width: 90 },
        ];
      case 'profitability':
        return [
          { header: 'Job', key: 'jobName', align: 'left', width: 150 },
          { header: 'Contract Value', key: 'contractValue', align: 'right', format: this.formatMoney, width: 100 },
          { header: 'Expenses', key: 'totalExpenses', align: 'right', format: this.formatMoney, width: 95 },
          { header: 'Labor Cost', key: 'laborCost', align: 'right', format: this.formatMoney, width: 95 },
          { header: 'Net Profit', key: 'netProfit', align: 'right', format: this.formatMoney, width: 95 },
          { header: 'Margin %', key: 'marginPct', align: 'right', format: (v) => `${v.toFixed(1)}%`, width: 75 },
        ];
      case 'labor_hours':
        return [
          { header: 'Crew Member', key: 'crewMember', align: 'left', width: 130 },
          { header: 'Job', key: 'jobName', align: 'left', width: 130 },
          { header: 'Date', key: 'date', align: 'left', width: 80 },
          { header: 'Hours', key: 'hours', align: 'right', format: (v) => v.toFixed(2), width: 65 },
          { header: 'OT Hours', key: 'overtimeHours', align: 'right', format: (v) => v.toFixed(2), width: 65 },
          { header: 'Rate', key: 'hourlyRate', align: 'right', format: this.formatMoney, width: 75 },
          { header: 'Cost', key: 'totalCost', align: 'right', format: this.formatMoney, width: 85 },
        ];
      case 'expense_detail':
        return [
          { header: 'Date', key: 'date', align: 'left', width: 75 },
          { header: 'Job', key: 'jobName', align: 'left', width: 120 },
          { header: 'Category', key: 'category', align: 'left', width: 90 },
          { header: 'Description', key: 'description', align: 'left', width: 130 },
          { header: 'Merchant', key: 'merchant', align: 'left', width: 100 },
          { header: 'Amount', key: 'amount', align: 'right', format: this.formatMoney, width: 80 },
          { header: 'Tax Category', key: 'taxCategory', align: 'left', width: 95 },
        ];
      case 'tax_deductions':
        return [
          { header: 'Tax Category', key: 'taxCategory', align: 'left', width: 350 },
          { header: 'Amount', key: 'totalAmount', align: 'right', format: this.formatMoney, width: 120 },
          { header: 'Transactions', key: 'transactionCount', align: 'right', format: (v) => String(v), width: 100 },
        ];
      default:
        return [];
    }
  }

  // ---------------------------------------------------------------------------
  // CSV Generation
  // ---------------------------------------------------------------------------

  private generateCsv(data: any[], columns: ColumnDef[], config: GenerateReportDto): ReportOutput {
    const rows: string[] = [];

    // Header row
    rows.push(columns.map((c) => this.csvEscape(c.header)).join(','));

    // Data rows
    for (const row of data) {
      const values = columns.map((col) => {
        const raw = row[col.key];
        const formatted = col.format ? col.format(raw) : String(raw ?? '');
        return this.csvEscape(formatted);
      });
      rows.push(values.join(','));
    }

    const csv = rows.join('\n');
    const buffer = Buffer.from(csv, 'utf-8');
    const slug = config.type.replace(/_/g, '-');
    const filename = `${slug}_${config.dateRange.start}_${config.dateRange.end}.csv`;

    return { buffer, filename, contentType: 'text/csv' };
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  // ---------------------------------------------------------------------------
  // PDF Generation
  // ---------------------------------------------------------------------------

  private async generatePdf(
    data: any[],
    columns: ColumnDef[],
    config: GenerateReportDto,
  ): Promise<ReportOutput> {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER', layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const pageWidth = 792; // LETTER landscape width
    const leftMargin = 50;
    const rightMargin = 50;
    const usableWidth = pageWidth - leftMargin - rightMargin;

    // Calculate column positions
    const totalDefinedWidth = columns.reduce((sum, c) => sum + (c.width ?? 100), 0);
    const scale = usableWidth / totalDefinedWidth;
    const colWidths = columns.map((c) => Math.floor((c.width ?? 100) * scale));
    const colPositions: number[] = [];
    let xPos = leftMargin;
    for (const w of colWidths) {
      colPositions.push(xPos);
      xPos += w;
    }

    // --- Title ---
    doc.fontSize(18).font('Helvetica-Bold').text(config.title, leftMargin, 50, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#666666');
    doc.text(`${config.dateRange.start} to ${config.dateRange.end}`, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(1);

    // --- Table Header ---
    let y = doc.y;
    this.drawRect(doc, leftMargin, y - 3, usableWidth, 20, '#e8e8e8');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      doc.text(col.header, colPositions[i] + 2, y, {
        width: colWidths[i] - 4,
        align: col.align ?? 'left',
      });
    }
    doc.fillColor('#000000');
    y += 20;
    this.drawLine(doc, y, leftMargin, leftMargin + usableWidth);
    y += 5;

    // --- Data Rows ---
    doc.font('Helvetica').fontSize(8);
    const maxY = 530; // landscape LETTER height is 612, leave room for footer

    for (const row of data) {
      if (y > maxY) {
        this.drawFooter(doc);
        doc.addPage();
        y = 50;
        // Redraw header on new page
        this.drawRect(doc, leftMargin, y - 3, usableWidth, 20, '#e8e8e8');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          doc.text(col.header, colPositions[i] + 2, y, {
            width: colWidths[i] - 4,
            align: col.align ?? 'left',
          });
        }
        doc.fillColor('#000000').font('Helvetica').fontSize(8);
        y += 20;
        this.drawLine(doc, y, leftMargin, leftMargin + usableWidth);
        y += 5;
      }

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const raw = row[col.key];
        const formatted = col.format ? col.format(raw) : String(raw ?? '');
        doc.text(formatted, colPositions[i] + 2, y, {
          width: colWidths[i] - 4,
          align: col.align ?? 'left',
        });
      }
      y += 16;
    }

    // --- Totals Row ---
    const totals = this.computeTotals(data, columns, config.type);
    if (totals) {
      y += 2;
      this.drawLine(doc, y, leftMargin, leftMargin + usableWidth);
      y += 5;
      doc.font('Helvetica-Bold').fontSize(8);
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const value = totals[col.key];
        if (value !== undefined) {
          const formatted = col.format ? col.format(value) : String(value);
          doc.text(formatted, colPositions[i] + 2, y, {
            width: colWidths[i] - 4,
            align: col.align ?? 'left',
          });
        }
      }
    }

    // --- Footer ---
    this.drawFooter(doc);

    doc.end();
    await new Promise<void>((resolve) => doc.on('end', resolve));

    const buffer = Buffer.concat(chunks);
    const slug = config.type.replace(/_/g, '-');
    const filename = `${slug}_${config.dateRange.start}_${config.dateRange.end}.pdf`;

    return { buffer, filename, contentType: 'application/pdf' };
  }

  private computeTotals(
    data: any[],
    columns: ColumnDef[],
    type: string,
  ): Record<string, any> | null {
    if (data.length === 0) return null;

    switch (type) {
      case 'job_summary': {
        const totals: Record<string, any> = { jobName: 'TOTAL' };
        totals.totalExpenses = data.reduce((s, r) => s + r.totalExpenses, 0);
        totals.laborHours = data.reduce((s, r) => s + r.laborHours, 0);
        totals.laborCost = data.reduce((s, r) => s + r.laborCost, 0);
        totals.materialCost = data.reduce((s, r) => s + r.materialCost, 0);
        totals.budget = data.reduce((s, r) => s + r.budget, 0);
        const totalSpent = totals.totalExpenses + totals.laborCost;
        totals.budgetUsedPct = totals.budget > 0 ? Math.round((totalSpent / totals.budget) * 10000) / 100 : 0;
        return totals;
      }
      case 'profitability': {
        const totals: Record<string, any> = { jobName: 'TOTAL' };
        totals.contractValue = data.reduce((s, r) => s + r.contractValue, 0);
        totals.totalExpenses = data.reduce((s, r) => s + r.totalExpenses, 0);
        totals.laborCost = data.reduce((s, r) => s + r.laborCost, 0);
        totals.netProfit = data.reduce((s, r) => s + r.netProfit, 0);
        totals.marginPct =
          totals.contractValue > 0
            ? Math.round((totals.netProfit / totals.contractValue) * 10000) / 100
            : 0;
        return totals;
      }
      case 'labor_hours': {
        const totals: Record<string, any> = { crewMember: 'TOTAL' };
        totals.hours = data.reduce((s, r) => s + r.hours, 0);
        totals.overtimeHours = data.reduce((s, r) => s + r.overtimeHours, 0);
        totals.totalCost = data.reduce((s, r) => s + r.totalCost, 0);
        return totals;
      }
      case 'expense_detail': {
        const totals: Record<string, any> = { date: 'TOTAL' };
        totals.amount = data.reduce((s, r) => s + r.amount, 0);
        return totals;
      }
      case 'tax_deductions': {
        const totals: Record<string, any> = { taxCategory: 'TOTAL' };
        totals.totalAmount = data.reduce((s, r) => s + r.totalAmount, 0);
        totals.transactionCount = data.reduce((s, r) => s + r.transactionCount, 0);
        return totals;
      }
      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // PDF Helpers
  // ---------------------------------------------------------------------------

  private drawLine(doc: PDFKit.PDFDocument, y: number, x1: number, x2: number): void {
    doc
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .moveTo(x1, y)
      .lineTo(x2, y)
      .stroke()
      .strokeColor('#000000');
  }

  private drawRect(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
  ): void {
    doc.save().rect(x, y, w, h).fill(color).restore();
  }

  private drawFooter(doc: PDFKit.PDFDocument): void {
    doc.fontSize(8).font('Helvetica').fillColor('#999999');
    doc.text('Generated by JobReceipt', 50, 570, { align: 'center' });
    doc.fillColor('#000000');
  }

  private formatMoney(cents: number): string {
    const dollars = cents / 100;
    return (
      '$' +
      dollars.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
}
