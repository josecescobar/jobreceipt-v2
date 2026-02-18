import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { CreateEstimateLineItemDto } from './dto/create-estimate.dto';

interface CreateEstimateData {
  jobId: string;
  issueDate?: string;
  expiresAt?: string;
  notes?: string;
  taxRate?: number;
  lineItems: CreateEstimateLineItemDto[];
}

interface UpdateEstimateData {
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  issueDate?: string;
  expiresAt?: string;
  notes?: string;
  taxRate?: number;
  lineItems?: CreateEstimateLineItemDto[];
}

const estimateInclude = {
  job: { select: { id: true, name: true, customerName: true, customerAddress: true } },
  lineItems: {
    orderBy: { sortOrder: 'asc' as const },
  },
};

@Injectable()
export class EstimatesService {
  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService,
  ) {}

  private async generateEstimateNumber(orgId: string): Promise<string> {
    const latest = await this.prisma.estimate.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      select: { estimateNumber: true },
    });

    if (!latest) return 'EST-0001';

    const match = latest.estimateNumber.match(/EST-(\d+)/);
    const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
    return `EST-${String(nextNum).padStart(4, '0')}`;
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

  async create(orgId: string, userId: string, data: CreateEstimateData) {
    const estimateNumber = await this.generateEstimateNumber(orgId);
    const taxRate = data.taxRate ?? 0;
    const { subtotal, taxAmount, total } = this.computeTotals(data.lineItems, taxRate);

    return this.prisma.$transaction(async (tx) => {
      const estimate = await tx.estimate.create({
        data: {
          organization: { connect: { id: orgId } },
          job: { connect: { id: data.jobId } },
          createdBy: { connect: { id: userId } },
          estimateNumber,
          issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          notes: data.notes,
          taxRate,
          subtotal,
          taxAmount,
          total,
        },
      });

      if (data.lineItems.length > 0) {
        await tx.estimateLineItem.createMany({
          data: data.lineItems.map((item, index) => ({
            estimateId: estimate.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: Math.round(item.quantity * item.unitPrice),
            sortOrder: index,
          })),
        });
      }

      return tx.estimate.findUnique({
        where: { id: estimate.id },
        include: estimateInclude,
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
      this.prisma.estimate.findMany({
        where,
        include: estimateInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.estimate.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, organizationId: orgId },
      include: estimateInclude,
    });
    if (!estimate) throw new NotFoundException('Estimate not found');
    return estimate;
  }

  async update(orgId: string, id: string, data: UpdateEstimateData) {
    const existing = await this.findOne(orgId, id);

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.issueDate !== undefined) updateData.issueDate = new Date(data.issueDate);
      if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const taxRate = data.taxRate ?? existing.taxRate;
      if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;

      if (data.lineItems) {
        await tx.estimateLineItem.deleteMany({ where: { estimateId: id } });
        if (data.lineItems.length > 0) {
          await tx.estimateLineItem.createMany({
            data: data.lineItems.map((item, index) => ({
              estimateId: id,
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
        const items = await tx.estimateLineItem.findMany({ where: { estimateId: id } });
        const { subtotal, taxAmount, total } = this.computeTotals(items, taxRate);
        updateData.subtotal = subtotal;
        updateData.taxAmount = taxAmount;
        updateData.total = total;
      }

      await tx.estimate.update({ where: { id }, data: updateData });

      return tx.estimate.findUnique({
        where: { id },
        include: estimateInclude,
      });
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.estimate.delete({ where: { id } });
  }

  async convertToInvoice(orgId: string, estimateId: string, userId: string) {
    const estimate = await this.findOne(orgId, estimateId);

    if (estimate.status !== 'ACCEPTED') {
      throw new BadRequestException('Only accepted estimates can be converted to invoices');
    }

    const lineItems = (estimate.lineItems ?? []).map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    const invoice = await this.invoicesService.create(orgId, userId, {
      jobId: estimate.jobId,
      taxRate: estimate.taxRate,
      notes: estimate.notes ?? undefined,
      lineItems,
    });

    await this.prisma.estimate.update({
      where: { id: estimateId },
      data: {
        status: 'CONVERTED',
        convertedInvoiceId: invoice!.id,
      },
    });

    return invoice;
  }
}
