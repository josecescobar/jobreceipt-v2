import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceLineItemDto } from './dto/create-invoice.dto';

interface CreateInvoiceData {
  jobId: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  taxRate?: number;
  lineItems: CreateInvoiceLineItemDto[];
}

interface UpdateInvoiceData {
  status?: 'DRAFT' | 'SENT' | 'PAID';
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
}
