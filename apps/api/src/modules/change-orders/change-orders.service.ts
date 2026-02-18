import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChangeOrderLineItemDto } from './dto/create-change-order.dto';

interface CreateChangeOrderData {
  jobId: string;
  title: string;
  description?: string;
  reason?: string;
  taxRate?: number;
  lineItems: CreateChangeOrderLineItemDto[];
}

interface UpdateChangeOrderData {
  status?: 'DRAFT' | 'SUBMITTED';
  title?: string;
  description?: string;
  reason?: string;
  taxRate?: number;
  lineItems?: CreateChangeOrderLineItemDto[];
}

const changeOrderInclude = {
  job: { select: { id: true, name: true, customerName: true } },
  lineItems: {
    orderBy: { sortOrder: 'asc' as const },
    include: { costCode: { select: { id: true, code: true, name: true } } },
  },
  createdBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
};

@Injectable()
export class ChangeOrdersService {
  constructor(private prisma: PrismaService) {}

  private async generateChangeOrderNumber(orgId: string): Promise<string> {
    const latest = await this.prisma.changeOrder.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      select: { changeOrderNumber: true },
    });

    if (!latest) return 'CO-0001';

    const match = latest.changeOrderNumber.match(/CO-(\d+)/);
    const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
    return `CO-${String(nextNum).padStart(4, '0')}`;
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

  async create(orgId: string, userId: string, data: CreateChangeOrderData) {
    const changeOrderNumber = await this.generateChangeOrderNumber(orgId);
    const taxRate = data.taxRate ?? 0;
    const { subtotal, taxAmount, total } = this.computeTotals(data.lineItems, taxRate);

    return this.prisma.$transaction(async (tx) => {
      const changeOrder = await tx.changeOrder.create({
        data: {
          organization: { connect: { id: orgId } },
          job: { connect: { id: data.jobId } },
          createdBy: { connect: { id: userId } },
          changeOrderNumber,
          title: data.title,
          description: data.description,
          reason: data.reason,
          taxRate,
          subtotal,
          taxAmount,
          total,
        },
      });

      if (data.lineItems.length > 0) {
        await tx.changeOrderLineItem.createMany({
          data: data.lineItems.map((item, index) => ({
            changeOrderId: changeOrder.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: Math.round(item.quantity * item.unitPrice),
            costCodeId: item.costCodeId || null,
            sortOrder: index,
          })),
        });
      }

      return tx.changeOrder.findUnique({
        where: { id: changeOrder.id },
        include: changeOrderInclude,
      });
    });
  }

  async findAll(
    orgId: string,
    query: { jobId: string; status?: string; page: number; limit: number },
  ) {
    const where: any = { organizationId: orgId, jobId: query.jobId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.changeOrder.findMany({
        where,
        include: changeOrderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.changeOrder.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const changeOrder = await this.prisma.changeOrder.findFirst({
      where: { id, organizationId: orgId },
      include: changeOrderInclude,
    });
    if (!changeOrder) throw new NotFoundException('Change order not found');
    return changeOrder;
  }

  async update(orgId: string, id: string, data: UpdateChangeOrderData) {
    const existing = await this.findOne(orgId, id);

    if (existing.status !== 'DRAFT' && (data.lineItems || data.title || data.description || data.reason || data.taxRate !== undefined)) {
      throw new BadRequestException('Only draft change orders can be edited');
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.reason !== undefined) updateData.reason = data.reason;

      const taxRate = data.taxRate ?? existing.taxRate;
      if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;

      if (data.lineItems) {
        await tx.changeOrderLineItem.deleteMany({ where: { changeOrderId: id } });
        if (data.lineItems.length > 0) {
          await tx.changeOrderLineItem.createMany({
            data: data.lineItems.map((item, index) => ({
              changeOrderId: id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: Math.round(item.quantity * item.unitPrice),
              costCodeId: item.costCodeId || null,
              sortOrder: index,
            })),
          });
        }
        const { subtotal, taxAmount, total } = this.computeTotals(data.lineItems, taxRate);
        updateData.subtotal = subtotal;
        updateData.taxAmount = taxAmount;
        updateData.total = total;
      } else if (data.taxRate !== undefined) {
        const items = await tx.changeOrderLineItem.findMany({ where: { changeOrderId: id } });
        const { subtotal, taxAmount, total } = this.computeTotals(items, taxRate);
        updateData.subtotal = subtotal;
        updateData.taxAmount = taxAmount;
        updateData.total = total;
      }

      await tx.changeOrder.update({ where: { id }, data: updateData });

      return tx.changeOrder.findUnique({
        where: { id },
        include: changeOrderInclude,
      });
    });
  }

  async remove(orgId: string, id: string) {
    const existing = await this.findOne(orgId, id);
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Only draft change orders can be deleted');
    }
    return this.prisma.changeOrder.delete({ where: { id } });
  }

  async approve(orgId: string, id: string, approverId: string) {
    const changeOrder = await this.findOne(orgId, id);

    if (changeOrder.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted change orders can be approved');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.changeOrder.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: approverId,
          approvedAt: new Date(),
        },
        include: changeOrderInclude,
      });

      // Adjust job budget and contract value
      await tx.job.update({
        where: { id: changeOrder.jobId },
        data: {
          budgetTotal: { increment: changeOrder.total },
          contractValue: { increment: changeOrder.total },
        },
      });

      return updated;
    });
  }

  async reject(orgId: string, id: string, approverId: string) {
    const changeOrder = await this.findOne(orgId, id);

    if (changeOrder.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted change orders can be rejected');
    }

    return this.prisma.changeOrder.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: approverId,
        approvedAt: new Date(),
      },
      include: changeOrderInclude,
    });
  }
}
