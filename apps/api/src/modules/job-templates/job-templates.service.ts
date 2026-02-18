import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobTemplateLineItemDto } from './dto/create-job-template.dto';

interface CreateJobTemplateData {
  name: string;
  description?: string;
  customerName?: string;
  budgetTotal?: number;
  budgetMaterials?: number;
  budgetLabor?: number;
  contractValue?: number;
  notes?: string;
  lineItems?: CreateJobTemplateLineItemDto[];
}

interface UpdateJobTemplateData {
  name?: string;
  description?: string;
  customerName?: string;
  budgetTotal?: number;
  budgetMaterials?: number;
  budgetLabor?: number;
  contractValue?: number;
  notes?: string;
  lineItems?: CreateJobTemplateLineItemDto[];
}

const templateInclude = {
  lineItems: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      costCode: { select: { id: true, code: true, name: true } },
    },
  },
  createdBy: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class JobTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, data: CreateJobTemplateData) {
    return this.prisma.$transaction(async (tx) => {
      const template = await tx.jobTemplate.create({
        data: {
          organizationId: orgId,
          name: data.name,
          description: data.description || null,
          customerName: data.customerName || null,
          budgetTotal: data.budgetTotal ?? null,
          budgetMaterials: data.budgetMaterials ?? null,
          budgetLabor: data.budgetLabor ?? null,
          contractValue: data.contractValue ?? null,
          notes: data.notes || null,
          createdById: userId,
        },
      });

      if (data.lineItems && data.lineItems.length > 0) {
        await tx.jobTemplateLineItem.createMany({
          data: data.lineItems.map((item, index) => ({
            templateId: template.id,
            description: item.description,
            category: item.category || null,
            estimatedAmount: item.estimatedAmount ?? null,
            costCodeId: item.costCodeId || null,
            sortOrder: index,
          })),
        });
      }

      return tx.jobTemplate.findUnique({
        where: { id: template.id },
        include: templateInclude,
      });
    });
  }

  async findAll(orgId: string, query: { page: number; limit: number }) {
    const where = { organizationId: orgId };

    const [data, total] = await Promise.all([
      this.prisma.jobTemplate.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: templateInclude,
      }),
      this.prisma.jobTemplate.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const template = await this.prisma.jobTemplate.findFirst({
      where: { id, organizationId: orgId },
      include: templateInclude,
    });
    if (!template) throw new NotFoundException('Job template not found');
    return template;
  }

  async update(orgId: string, id: string, data: UpdateJobTemplateData) {
    await this.findOne(orgId, id);

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.customerName !== undefined) updateData.customerName = data.customerName;
      if (data.budgetTotal !== undefined) updateData.budgetTotal = data.budgetTotal;
      if (data.budgetMaterials !== undefined) updateData.budgetMaterials = data.budgetMaterials;
      if (data.budgetLabor !== undefined) updateData.budgetLabor = data.budgetLabor;
      if (data.contractValue !== undefined) updateData.contractValue = data.contractValue;
      if (data.notes !== undefined) updateData.notes = data.notes;

      if (data.lineItems) {
        await tx.jobTemplateLineItem.deleteMany({ where: { templateId: id } });
        if (data.lineItems.length > 0) {
          await tx.jobTemplateLineItem.createMany({
            data: data.lineItems.map((item, index) => ({
              templateId: id,
              description: item.description,
              category: item.category || null,
              estimatedAmount: item.estimatedAmount ?? null,
              costCodeId: item.costCodeId || null,
              sortOrder: index,
            })),
          });
        }
      }

      await tx.jobTemplate.update({ where: { id }, data: updateData });

      return tx.jobTemplate.findUnique({
        where: { id },
        include: templateInclude,
      });
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.jobTemplate.delete({ where: { id } });
  }

  async createFromJob(orgId: string, jobId: string, userId: string, templateName: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, organizationId: orgId },
    });
    if (!job) throw new NotFoundException('Job not found');

    // Group expenses by category to auto-populate line items
    const expenseGroups = await this.prisma.expense.groupBy({
      by: ['category'],
      where: { organizationId: orgId, jobId },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    return this.prisma.$transaction(async (tx) => {
      const template = await tx.jobTemplate.create({
        data: {
          organizationId: orgId,
          name: templateName,
          description: job.notes || null,
          customerName: job.customerName || null,
          budgetTotal: job.budgetTotal,
          budgetMaterials: job.budgetMaterials,
          budgetLabor: job.budgetLabor,
          contractValue: job.contractValue,
          notes: job.notes,
          createdById: userId,
        },
      });

      if (expenseGroups.length > 0) {
        await tx.jobTemplateLineItem.createMany({
          data: expenseGroups.map((g, index) => ({
            templateId: template.id,
            description: g.category || 'General Expenses',
            category: g.category || null,
            estimatedAmount: g._sum.amount ?? null,
            sortOrder: index,
          })),
        });
      }

      return tx.jobTemplate.findUnique({
        where: { id: template.id },
        include: templateInclude,
      });
    });
  }
}
