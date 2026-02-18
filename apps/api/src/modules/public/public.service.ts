import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const invoiceInclude = {
  job: { select: { id: true, name: true, customerName: true, customerAddress: true } },
  lineItems: { orderBy: { sortOrder: 'asc' as const } },
  payments: { orderBy: { createdAt: 'asc' as const } },
  organization: { select: { name: true } },
};

const estimateInclude = {
  job: { select: { id: true, name: true, customerName: true, customerAddress: true } },
  lineItems: { orderBy: { sortOrder: 'asc' as const } },
  organization: { select: { name: true } },
};

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async findInvoiceByToken(token: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { shareToken: token },
      include: invoiceInclude,
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async findEstimateByToken(token: string) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { shareToken: token },
      include: estimateInclude,
    });
    if (!estimate) throw new NotFoundException('Estimate not found');
    return estimate;
  }

  async acceptEstimate(token: string) {
    const estimate = await this.findEstimateByToken(token);
    if (estimate.status !== 'SENT') {
      throw new NotFoundException('This estimate cannot be accepted');
    }
    return this.prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: 'ACCEPTED' },
      include: estimateInclude,
    });
  }

  renderInvoiceHtml(invoice: any): string {
    const orgName = invoice.organization?.name || 'Company';
    const lineItemsHtml = (invoice.lineItems ?? [])
      .map(
        (item: any) => `
      <tr>
        <td>${this.esc(item.description)}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">${this.money(item.unitPrice)}</td>
        <td class="right">${this.money(item.total)}</td>
      </tr>`,
      )
      .join('');

    const taxRow =
      invoice.taxRate > 0
        ? `<tr><td colspan="3" class="right label">Tax (${(invoice.taxRate * 100).toFixed(1)}%):</td><td class="right">${this.money(invoice.taxAmount)}</td></tr>`
        : '';

    const paymentsHtml = (invoice.payments ?? [])
      .map(
        (p: any) => `
      <tr class="payment">
        <td colspan="3" class="right label">Payment (${p.method.replace(/_/g, ' ')}) - ${this.formatDate(p.date)}:</td>
        <td class="right">-${this.money(p.amount)}</td>
      </tr>`,
      )
      .join('');

    const balanceDue = invoice.total - (invoice.paidAmount || 0);
    const balanceRow =
      (invoice.paidAmount || 0) > 0
        ? `<tr class="total-row"><td colspan="3" class="right label">Balance Due:</td><td class="right bold">${this.money(balanceDue)}</td></tr>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice ${this.esc(invoice.invoiceNumber)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
  .container { max-width: 700px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
  .header h1 { font-size: 28px; color: #2563eb; }
  .header .details { text-align: right; font-size: 14px; color: #666; }
  .header .details strong { color: #333; }
  .bill-to { margin-bottom: 30px; }
  .bill-to h3 { font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 5px; }
  .bill-to p { font-size: 14px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb; }
  th.right, td.right { text-align: right; }
  td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
  .label { font-weight: 500; color: #666; }
  .total-row td { border-top: 2px solid #e5e7eb; font-size: 18px; padding-top: 12px; }
  .bold { font-weight: 700; }
  .payment td { color: #16a34a; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .status-DRAFT { background: #f3f4f6; color: #6b7280; }
  .status-SENT { background: #dbeafe; color: #2563eb; }
  .status-PAID { background: #dcfce7; color: #16a34a; }
  .status-PARTIALLY_PAID { background: #fef3c7; color: #d97706; }
  .notes { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; font-size: 13px; }
  .notes h4 { margin-bottom: 5px; font-size: 12px; text-transform: uppercase; color: #999; }
  .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
  .actions { margin-top: 20px; text-align: center; }
  .actions a { display: inline-block; padding: 10px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }
  @media (max-width: 600px) { .container { margin: 10px; padding: 20px; } .header { flex-direction: column; } .header .details { text-align: left; margin-top: 10px; } }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <h1>INVOICE</h1>
      <p style="color:#666;font-size:14px;">${this.esc(orgName)}</p>
    </div>
    <div class="details">
      <p><strong>Invoice #:</strong> ${this.esc(invoice.invoiceNumber)}</p>
      <p><strong>Date:</strong> ${this.formatDate(invoice.issueDate)}</p>
      ${invoice.dueDate ? `<p><strong>Due:</strong> ${this.formatDate(invoice.dueDate)}</p>` : ''}
      <p><span class="status status-${invoice.status}">${invoice.status.replace(/_/g, ' ')}</span></p>
    </div>
  </div>

  ${
    invoice.job
      ? `<div class="bill-to">
    <h3>Bill To</h3>
    ${invoice.job.customerName ? `<p><strong>${this.esc(invoice.job.customerName)}</strong></p>` : ''}
    ${invoice.job.customerAddress ? `<p>${this.esc(invoice.job.customerAddress)}</p>` : ''}
    <p style="margin-top:5px;color:#666;">Job: ${this.esc(invoice.job.name)}</p>
  </div>`
      : ''
  }

  <table>
    <thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead>
    <tbody>
      ${lineItemsHtml}
      <tr><td colspan="3" class="right label">Subtotal:</td><td class="right">${this.money(invoice.subtotal)}</td></tr>
      ${taxRow}
      <tr class="total-row"><td colspan="3" class="right label">Total:</td><td class="right bold">${this.money(invoice.total)}</td></tr>
      ${paymentsHtml}
      ${balanceRow}
    </tbody>
  </table>

  ${invoice.notes ? `<div class="notes"><h4>Notes</h4><p>${this.esc(invoice.notes)}</p></div>` : ''}

  <div class="actions">
    <a href="pdf">Download PDF</a>
  </div>

  <div class="footer">
    <p>Generated by JobReceipt</p>
  </div>
</div>
</body>
</html>`;
  }

  renderEstimateHtml(estimate: any): string {
    const orgName = estimate.organization?.name || 'Company';
    const lineItemsHtml = (estimate.lineItems ?? [])
      .map(
        (item: any) => `
      <tr>
        <td>${this.esc(item.description)}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">${this.money(item.unitPrice)}</td>
        <td class="right">${this.money(item.total)}</td>
      </tr>`,
      )
      .join('');

    const taxRow =
      estimate.taxRate > 0
        ? `<tr><td colspan="3" class="right label">Tax (${(estimate.taxRate * 100).toFixed(1)}%):</td><td class="right">${this.money(estimate.taxAmount)}</td></tr>`
        : '';

    const canAccept = estimate.status === 'SENT';
    const acceptButton = canAccept
      ? `<form method="POST" action="accept" style="display:inline;">
          <button type="submit" style="display:inline-block;padding:10px 24px;background:#16a34a;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:14px;margin-right:10px;">Accept Estimate</button>
        </form>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Estimate ${this.esc(estimate.estimateNumber)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
  .container { max-width: 700px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
  .header h1 { font-size: 28px; color: #7c3aed; }
  .header .details { text-align: right; font-size: 14px; color: #666; }
  .header .details strong { color: #333; }
  .bill-to { margin-bottom: 30px; }
  .bill-to h3 { font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 5px; }
  .bill-to p { font-size: 14px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb; }
  th.right, td.right { text-align: right; }
  td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
  .label { font-weight: 500; color: #666; }
  .total-row td { border-top: 2px solid #e5e7eb; font-size: 18px; padding-top: 12px; }
  .bold { font-weight: 700; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .status-DRAFT { background: #f3f4f6; color: #6b7280; }
  .status-SENT { background: #dbeafe; color: #2563eb; }
  .status-ACCEPTED { background: #dcfce7; color: #16a34a; }
  .status-REJECTED { background: #fee2e2; color: #dc2626; }
  .status-EXPIRED { background: #fef3c7; color: #d97706; }
  .notes { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; font-size: 13px; }
  .notes h4 { margin-bottom: 5px; font-size: 12px; text-transform: uppercase; color: #999; }
  .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
  .actions { margin-top: 20px; text-align: center; }
  .actions a { display: inline-block; padding: 10px 24px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }
  .accepted-banner { background: #dcfce7; border: 1px solid #86efac; padding: 12px 20px; border-radius: 6px; text-align: center; margin-bottom: 20px; color: #16a34a; font-weight: 600; }
  @media (max-width: 600px) { .container { margin: 10px; padding: 20px; } .header { flex-direction: column; } .header .details { text-align: left; margin-top: 10px; } }
</style>
</head>
<body>
<div class="container">
  ${estimate.status === 'ACCEPTED' ? '<div class="accepted-banner">This estimate has been accepted</div>' : ''}

  <div class="header">
    <div>
      <h1>ESTIMATE</h1>
      <p style="color:#666;font-size:14px;">${this.esc(orgName)}</p>
    </div>
    <div class="details">
      <p><strong>Estimate #:</strong> ${this.esc(estimate.estimateNumber)}</p>
      <p><strong>Date:</strong> ${this.formatDate(estimate.issueDate)}</p>
      ${estimate.expiresAt ? `<p><strong>Expires:</strong> ${this.formatDate(estimate.expiresAt)}</p>` : ''}
      <p><span class="status status-${estimate.status}">${estimate.status}</span></p>
    </div>
  </div>

  ${
    estimate.job
      ? `<div class="bill-to">
    <h3>Prepared For</h3>
    ${estimate.job.customerName ? `<p><strong>${this.esc(estimate.job.customerName)}</strong></p>` : ''}
    ${estimate.job.customerAddress ? `<p>${this.esc(estimate.job.customerAddress)}</p>` : ''}
    <p style="margin-top:5px;color:#666;">Job: ${this.esc(estimate.job.name)}</p>
  </div>`
      : ''
  }

  <table>
    <thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead>
    <tbody>
      ${lineItemsHtml}
      <tr><td colspan="3" class="right label">Subtotal:</td><td class="right">${this.money(estimate.subtotal)}</td></tr>
      ${taxRow}
      <tr class="total-row"><td colspan="3" class="right label">Total:</td><td class="right bold">${this.money(estimate.total)}</td></tr>
    </tbody>
  </table>

  ${estimate.notes ? `<div class="notes"><h4>Notes</h4><p>${this.esc(estimate.notes)}</p></div>` : ''}

  <div class="actions">
    ${acceptButton}
    <a href="pdf">Download PDF</a>
  </div>

  <div class="footer">
    <p>Generated by JobReceipt</p>
  </div>
</div>
</body>
</html>`;
  }

  private money(cents: number): string {
    const dollars = (cents || 0) / 100;
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

  private esc(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
