import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { InvoicesService } from './invoices.service';

@Injectable()
export class InvoiceReportService {
  constructor(private invoicesService: InvoicesService) {}

  async generateInvoicePdf(
    orgId: string,
    invoiceId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.invoicesService.findOne(orgId, invoiceId);
    return this.generatePdfFromData(invoice);
  }

  async generatePdfFromData(invoice: any): Promise<{ buffer: Buffer; filename: string }> {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // --- Header ---
    doc.fontSize(28).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
    doc.moveDown(0.5);

    // Invoice details (right-aligned)
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' });
    doc.text(`Issue Date: ${this.formatDate(invoice.issueDate)}`, { align: 'right' });
    if (invoice.dueDate) {
      doc.text(`Due Date: ${this.formatDate(invoice.dueDate)}`, { align: 'right' });
    }
    doc.text(`Status: ${invoice.status}`, { align: 'right' });
    doc.moveDown(1);

    // --- Bill To ---
    if (invoice.job) {
      doc.fontSize(10).font('Helvetica-Bold').text('Bill To:');
      doc.font('Helvetica').fontSize(10);
      if (invoice.job.customerName) {
        doc.text(invoice.job.customerName);
      }
      if (invoice.job.customerAddress) {
        doc.text(invoice.job.customerAddress);
      }
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(`Job: ${invoice.job.name}`);
    }
    doc.moveDown(1);

    // --- Line Items Table ---
    const colX = { desc: 50, qty: 330, price: 390, total: 480 };
    const colW = { desc: 270, qty: 55, price: 85, total: 82 };

    // Table header
    let y = doc.y;
    this.drawRect(doc, 50, y - 3, 512, 20, '#f0f0f0');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333');
    doc.text('Description', colX.desc, y, { width: colW.desc });
    doc.text('Qty', colX.qty, y, { width: colW.qty, align: 'right' });
    doc.text('Unit Price', colX.price, y, { width: colW.price, align: 'right' });
    doc.text('Total', colX.total, y, { width: colW.total, align: 'right' });
    y += 20;
    this.drawLine(doc, y);
    y += 5;

    // Table rows
    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    const lineItems = invoice.lineItems ?? [];
    for (const item of lineItems) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(item.description, colX.desc, y, { width: colW.desc });
      doc.text(String(item.quantity), colX.qty, y, { width: colW.qty, align: 'right' });
      doc.text(this.formatMoney(item.unitPrice), colX.price, y, { width: colW.price, align: 'right' });
      doc.text(this.formatMoney(item.total), colX.total, y, { width: colW.total, align: 'right' });
      y += 18;
    }

    // --- Totals ---
    y += 5;
    this.drawLine(doc, y);
    y += 10;

    const totalsX = 400;
    const totalsW = 162;
    const labelsX = 300;
    const labelsW = 95;

    doc.fontSize(10).font('Helvetica');
    doc.text('Subtotal:', labelsX, y, { width: labelsW, align: 'right' });
    doc.text(this.formatMoney(invoice.subtotal), totalsX, y, { width: totalsW, align: 'right' });
    y += 18;

    if (invoice.taxRate > 0) {
      doc.text(`Tax (${(invoice.taxRate * 100).toFixed(1)}%):`, labelsX, y, { width: labelsW, align: 'right' });
      doc.text(this.formatMoney(invoice.taxAmount), totalsX, y, { width: totalsW, align: 'right' });
      y += 18;
    }

    this.drawLine(doc, y);
    y += 8;
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('Total:', labelsX, y, { width: labelsW, align: 'right' });
    doc.text(this.formatMoney(invoice.total), totalsX, y, { width: totalsW, align: 'right' });
    y += 25;

    // --- Payment History & Balance ---
    if (invoice.paidAmount > 0 && (invoice as any).payments?.length > 0) {
      doc.fontSize(10).font('Helvetica');
      const payments = (invoice as any).payments as Array<{
        amount: number;
        date: Date | string;
        method: string;
        note?: string;
      }>;

      for (const payment of payments) {
        if (y > 700) { doc.addPage(); y = 50; }
        const methodLabel = payment.method.replace(/_/g, ' ');
        const label = `Payment (${methodLabel}) - ${this.formatDate(payment.date)}:`;
        doc.text(label, labelsX - 100, y, { width: labelsW + 100, align: 'right' });
        doc.text(`-${this.formatMoney(payment.amount)}`, totalsX, y, { width: totalsW, align: 'right' });
        y += 16;
      }

      this.drawLine(doc, y);
      y += 8;
      const balanceDue = invoice.total - invoice.paidAmount;
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('Balance Due:', labelsX, y, { width: labelsW, align: 'right' });
      doc.text(this.formatMoney(balanceDue), totalsX, y, { width: totalsW, align: 'right' });
      y += 25;
    }

    // --- Notes ---
    if (invoice.notes) {
      doc.y = y;
      doc.moveDown(1);
      doc.fontSize(10).font('Helvetica-Bold').text('Notes:');
      doc.font('Helvetica').fontSize(9).text(invoice.notes);
    }

    // --- Footer ---
    doc.y = 720;
    doc.fontSize(8).font('Helvetica').fillColor('#999999');
    doc.text('Generated by JobReceipt', 50, doc.y, { align: 'center' });

    doc.end();

    await new Promise<void>((resolve) => doc.on('end', resolve));

    const buffer = Buffer.concat(chunks);
    const filename = `${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;

    return { buffer, filename };
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

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
