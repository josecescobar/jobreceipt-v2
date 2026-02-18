import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceLineItemDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

interface CreateInvoiceData {
  jobId: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  taxRate?: number;
  lineItems: CreateInvoiceLineItemDto[];
}

interface UpdateInvoiceData {
  status?: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID';
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  taxRate?: number;
  lineItems?: CreateInvoiceLineItemDto[];
}

const invoiceInclude = {
  job: { select: { id: true, name: true, customerName: true, customerAddress: true } },
  lineItems: {
    orderBy: { sortOrder: 'asc' as const },
  },
  payments: {
    orderBy: { date: 'desc' as const },
  },
};

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private async generateInvoiceNumber(orgId: string): Promise<string> {
    const latest = await this.prisma.invoice.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });

    if (!latest) return 'INV-0001';

    const match = latest.invoiceNumber.match(/INV-(\d+)/);
    const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
    return `INV-${String(nextNum).padStart(4, '0')}`;
  }

  private computeTotals(
    lineItems: { quantity: number; unitPrice: number }[],
    taxRate: number,
  ) {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + Math.round(item.quantity * item.unitPrice),
      0,
    );
    const taxAmount = Math.round(subtotal * taxRate);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }

  async create(orgId: string, userId: string, data: CreateInvoiceData) {
    const invoiceNumber = await this.generateInvoiceNumber(orgId);
    const taxRate = data.taxRate ?? 0;
    const { subtotal, taxAmount, total } = this.computeTotals(data.lineItems, taxRate);

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          organization: { connect: { id: orgId } },
          job: { connect: { id: data.jobId } },
          createdBy: { connect: { id: userId } },
          invoiceNumber,
          issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes,
          taxRate,
          subtotal,
          taxAmount,
          total,
        },
      });

      if (data.lineItems.length > 0) {
        await tx.invoiceLineItem.createMany({
          data: data.lineItems.map((item, index) => ({
            invoiceId: invoice.id,
            expenseId: item.expenseId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: Math.round(item.quantity * item.unitPrice),
            sortOrder: index,
          })),
        });
      }

      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: invoiceInclude,
      });
    });
  }

  async findAll(
    orgId: string,
    query: { jobId?: string; status?: string; page: number; limit: number },
  ) {
    const where: any = { organizationId: orgId };
    if (query.jobId) where.jobId = query.jobId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: invoiceInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId: orgId },
      include: invoiceInclude,
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async update(orgId: string, id: string, data: UpdateInvoiceData) {
    const existing = await this.findOne(orgId, id);

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.issueDate !== undefined) updateData.issueDate = new Date(data.issueDate);
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const taxRate = data.taxRate ?? existing.taxRate;
      if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;

      // If line items provided, replace them all
      if (data.lineItems) {
        await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
        if (data.lineItems.length > 0) {
          await tx.invoiceLineItem.createMany({
            data: data.lineItems.map((item, index) => ({
              invoiceId: id,
              expenseId: item.expenseId || null,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: Math.round(item.quantity * item.unitPrice),
              sortOrder: index,
            })),
          });
        }
        const { subtotal, taxAmount, total } = this.computeTotals(data.lineItems, taxRate);
        updateData.subtotal = subtotal;
        updateData.taxAmount = taxAmount;
        updateData.total = total;
      } else if (data.taxRate !== undefined) {
        // Recalculate with existing line items but new tax rate
        const items = await tx.invoiceLineItem.findMany({ where: { invoiceId: id } });
        const { subtotal, taxAmount, total } = this.computeTotals(items, taxRate);
        updateData.subtotal = subtotal;
        updateData.taxAmount = taxAmount;
        updateData.total = total;
      }

      await tx.invoice.update({ where: { id }, data: updateData });

      return tx.invoice.findUnique({
        where: { id },
        include: invoiceInclude,
      });
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.invoice.delete({ where: { id } });
  }

  async generateShareLink(orgId: string, id: string): Promise<{ url: string; token: string }> {
    const invoice = await this.findOne(orgId, id);

    if (invoice.shareToken) {
      const url = `${process.env.API_BASE_URL || 'https://api-production-5d58.up.railway.app'}/api/public/invoice/${invoice.shareToken}`;
      return { url, token: invoice.shareToken };
    }

    const token = randomUUID();
    await this.prisma.invoice.update({ where: { id }, data: { shareToken: token } });

    const url = `${process.env.API_BASE_URL || 'https://api-production-5d58.up.railway.app'}/api/public/invoice/${token}`;
    return { url, token };
  }

  private determineInvoiceStatus(paidAmount: number, total: number): 'SENT' | 'PARTIALLY_PAID' | 'PAID' {
    if (paidAmount >= total) return 'PAID';
    if (paidAmount > 0) return 'PARTIALLY_PAID';
    return 'SENT';
  }

  async addPayment(orgId: string, invoiceId: string, dto: CreatePaymentDto) {
    const invoice = await this.findOne(orgId, invoiceId);

    if (invoice.status === 'DRAFT') {
      throw new BadRequestException('Cannot add payment to a draft invoice');
    }

    const remaining = invoice.total - invoice.paidAmount;
    if (dto.amount > remaining) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds remaining balance (${remaining})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount: dto.amount,
          date: new Date(dto.date),
          method: dto.method,
          note: dto.note,
        },
      });

      const newPaidAmount = invoice.paidAmount + dto.amount;
      const newStatus = this.determineInvoiceStatus(newPaidAmount, invoice.total);

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaidAmount, status: newStatus },
      });

      return tx.invoice.findUnique({
        where: { id: invoiceId },
        include: invoiceInclude,
      });
    });
  }

  async getPayments(orgId: string, invoiceId: string) {
    await this.findOne(orgId, invoiceId);
    return this.prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: { date: 'desc' },
    });
  }

  async removePayment(orgId: string, invoiceId: string, paymentId: string) {
    const invoice = await this.findOne(orgId, invoiceId);

    const payment = await this.prisma.invoicePayment.findFirst({
      where: { id: paymentId, invoiceId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.invoicePayment.delete({ where: { id: paymentId } });

      const newPaidAmount = invoice.paidAmount - payment.amount;
      const newStatus = this.determineInvoiceStatus(newPaidAmount, invoice.total);

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaidAmount, status: newStatus },
      });

      return tx.invoice.findUnique({
        where: { id: invoiceId },
        include: invoiceInclude,
      });
    });
  }
}
