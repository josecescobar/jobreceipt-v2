import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsService } from './jobs.service';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

  async generateJobReport(
    orgId: string,
    jobId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const job = await this.jobsService.findOne(orgId, jobId);
    const budget = await this.jobsService.getBudget(orgId, jobId);

    const expenses = await this.prisma.expense.findMany({
      where: { organizationId: orgId, jobId },
      orderBy: { date: 'asc' },
    });

    const receipts = await this.prisma.receipt.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { lineItems: { some: { jobId } } },
          { expenses: { some: { jobId } } },
        ],
      },
      orderBy: { transactionDate: 'asc' },
    });

    const mileageTrips = await this.prisma.mileageTrip.findMany({
      where: { organizationId: orgId, jobId },
      orderBy: { date: 'asc' },
    });

    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // --- Header ---
    doc.fontSize(22).font('Helvetica-Bold').text('Job Expense Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(16).text(job.name, { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica').fillColor('#666666');
    if (job.customerName) {
      doc.text(`Customer: ${job.customerName}`, { align: 'center' });
    }
    const dateRange = [
      job.startDate ? this.formatDate(job.startDate) : null,
      job.endDate ? this.formatDate(job.endDate) : null,
    ]
      .filter(Boolean)
      .join(' – ');
    if (dateRange) {
      doc.text(`Date Range: ${dateRange}`, { align: 'center' });
    }
    doc.text(`Generated: ${this.formatDate(new Date())}`, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(1);

    // --- Budget Overview ---
    if (budget.totalBudget > 0) {
      this.drawSectionHeader(doc, 'Budget Overview');
      const budgetCols = [
        { label: '', x: 50, width: 150 },
        { label: 'Budget', x: 200, width: 120 },
        { label: 'Spent', x: 320, width: 120 },
        { label: 'Remaining', x: 440, width: 120 },
      ];
      let y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      budgetCols.forEach((c) => {
        if (c.label) doc.text(c.label, c.x, y, { width: c.width, align: 'right' });
      });
      y += 15;
      this.drawLine(doc, y);
      y += 5;

      doc.font('Helvetica').fontSize(9);
      const budgetRows = [
        { label: 'Total', budget: budget.totalBudget, spent: budget.totalSpent, remaining: budget.totalRemaining },
        { label: 'Materials', budget: budget.materialsBudget, spent: budget.materialsSpent, remaining: budget.materialsRemaining },
        { label: 'Labor', budget: budget.laborBudget, spent: budget.laborSpent, remaining: budget.laborRemaining },
      ];
      for (const row of budgetRows) {
        y = this.checkPageBreak(doc, y);
        doc.text(row.label, 50, y, { width: 150 });
        doc.text(this.formatMoney(row.budget), 200, y, { width: 120, align: 'right' });
        doc.text(this.formatMoney(row.spent), 320, y, { width: 120, align: 'right' });
        doc.text(this.formatMoney(row.remaining), 440, y, { width: 120, align: 'right' });
        y += 15;
      }
      doc.y = y;
      doc.moveDown(1);
    }

    // --- Expenses Table ---
    this.drawSectionHeader(doc, 'Expenses');
    if (expenses.length > 0) {
      let y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Date', 50, y, { width: 80 });
      doc.text('Description', 130, y, { width: 220 });
      doc.text('Category', 350, y, { width: 100 });
      doc.text('Amount', 450, y, { width: 110, align: 'right' });
      y += 15;
      this.drawLine(doc, y);
      y += 5;

      doc.font('Helvetica').fontSize(9);
      let expenseTotal = 0;
      for (const exp of expenses) {
        y = this.checkPageBreak(doc, y);
        doc.text(exp.date ? this.formatDate(exp.date) : '—', 50, y, { width: 80 });
        doc.text(exp.description || '—', 130, y, { width: 220 });
        doc.text(exp.category || '—', 350, y, { width: 100 });
        doc.text(this.formatMoney(exp.amount), 450, y, { width: 110, align: 'right' });
        expenseTotal += exp.amount;
        y += 15;
      }
      this.drawLine(doc, y);
      y += 5;
      doc.font('Helvetica-Bold');
      doc.text('Subtotal', 350, y, { width: 100 });
      doc.text(this.formatMoney(expenseTotal), 450, y, { width: 110, align: 'right' });
      y += 15;
      doc.y = y;
    } else {
      doc.fontSize(9).font('Helvetica').text('No expenses for this job.');
    }
    doc.moveDown(1);

    // --- Receipts Summary ---
    this.drawSectionHeader(doc, 'Receipts');
    if (receipts.length > 0) {
      let y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Date', 50, y, { width: 100 });
      doc.text('Merchant', 150, y, { width: 220 });
      doc.text('Total', 370, y, { width: 100, align: 'right' });
      doc.text('Status', 470, y, { width: 90, align: 'right' });
      y += 15;
      this.drawLine(doc, y);
      y += 5;

      doc.font('Helvetica').fontSize(9);
      for (const rec of receipts) {
        y = this.checkPageBreak(doc, y);
        doc.text(rec.transactionDate ? this.formatDate(rec.transactionDate) : '—', 50, y, { width: 100 });
        doc.text(rec.merchantName || 'Unknown', 150, y, { width: 220 });
        doc.text(rec.totalAmount != null ? this.formatMoney(rec.totalAmount) : '—', 370, y, { width: 100, align: 'right' });
        doc.text(rec.status, 470, y, { width: 90, align: 'right' });
        y += 15;
      }
      doc.y = y;
    } else {
      doc.fontSize(9).font('Helvetica').text('No receipts for this job.');
    }
    doc.moveDown(1);

    // --- Mileage Log ---
    this.drawSectionHeader(doc, 'Mileage');
    if (mileageTrips.length > 0) {
      let y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Date', 50, y, { width: 80 });
      doc.text('Miles', 130, y, { width: 60, align: 'right' });
      doc.text('Rate', 190, y, { width: 70, align: 'right' });
      doc.text('Deduction', 260, y, { width: 90, align: 'right' });
      doc.text('Purpose', 360, y, { width: 200 });
      y += 15;
      this.drawLine(doc, y);
      y += 5;

      doc.font('Helvetica').fontSize(9);
      let mileageTotal = 0;
      for (const trip of mileageTrips) {
        y = this.checkPageBreak(doc, y);
        doc.text(trip.date ? this.formatDate(trip.date) : '—', 50, y, { width: 80 });
        doc.text(trip.distanceMiles.toFixed(1), 130, y, { width: 60, align: 'right' });
        doc.text(this.formatMoney(trip.irsRate) + '/mi', 190, y, { width: 70, align: 'right' });
        doc.text(this.formatMoney(trip.totalDeduction), 260, y, { width: 90, align: 'right' });
        doc.text(trip.purpose || '—', 360, y, { width: 200 });
        mileageTotal += trip.totalDeduction;
        y += 15;
      }
      this.drawLine(doc, y);
      y += 5;
      doc.font('Helvetica-Bold');
      doc.text('Subtotal', 170, y, { width: 90 });
      doc.text(this.formatMoney(mileageTotal), 260, y, { width: 90, align: 'right' });
      y += 15;
      doc.y = y;
    } else {
      doc.fontSize(9).font('Helvetica').text('No mileage trips for this job.');
    }
    doc.moveDown(1.5);

    // --- Grand Total ---
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalMileage = mileageTrips.reduce((sum, t) => sum + t.totalDeduction, 0);
    const grandTotal = totalExpenses + totalMileage;

    let y = this.checkPageBreak(doc, doc.y, 60);
    this.drawLine(doc, y);
    y += 8;
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Total Expenses:', 50, y, { width: 350 });
    doc.text(this.formatMoney(totalExpenses), 400, y, { width: 160, align: 'right' });
    y += 18;
    doc.text('Total Mileage Deductions:', 50, y, { width: 350 });
    doc.text(this.formatMoney(totalMileage), 400, y, { width: 160, align: 'right' });
    y += 18;
    this.drawLine(doc, y);
    y += 8;
    doc.fontSize(14);
    doc.text('Grand Total:', 50, y, { width: 350 });
    doc.text(this.formatMoney(grandTotal), 400, y, { width: 160, align: 'right' });

    doc.end();

    await new Promise<void>((resolve) => doc.on('end', resolve));

    const buffer = Buffer.concat(chunks);
    const safeName = job.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const filename = `${safeName}_report_${new Date().toISOString().split('T')[0]}.pdf`;

    return { buffer, filename };
  }

  private drawSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
    doc.fontSize(13).font('Helvetica-Bold').text(title);
    doc.moveDown(0.3);
  }

  private drawLine(doc: PDFKit.PDFDocument, y: number): void {
    doc
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .moveTo(50, y)
      .lineTo(562, y)
      .stroke()
      .strokeColor('#000000');
  }

  private checkPageBreak(doc: PDFKit.PDFDocument, y: number, needed = 30): number {
    if (y > 700) {
      doc.addPage();
      return 50;
    }
    return y;
  }

  private formatMoney(cents: number): string {
    const dollars = cents / 100;
    return '$' + dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
