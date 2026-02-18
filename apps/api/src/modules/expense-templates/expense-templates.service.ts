import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateExpenseTemplateData {
  name: string;
  description?: string;
  amount?: number;
  category?: string;
  taxCategory?: string;
  costCodeId?: string;
  merchantName?: string;
}

type UpdateExpenseTemplateData = Partial<CreateExpenseTemplateData>;

const templateInclude = {
  costCode: { select: { id: true, code: true, name: true } },
};

@Injectable()
export class ExpenseTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, data: CreateExpenseTemplateData) {
    return this.prisma.expenseTemplate.create({
      data: {
        organization: { connect: { id: orgId } },
        createdBy: { connect: { id: userId } },
        name: data.name,
        description: data.description,
        amount: data.amount,
        category: data.category,
        taxCategory: data.taxCategory,
        merchantName: data.merchantName,
        ...(data.costCodeId
          ? { costCode: { connect: { id: data.costCodeId } } }
          : {}),
      },
      include: templateInclude,
    });
  }

  async saveFromExpense(orgId: string, userId: string, name: string, expenseId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, organizationId: orgId },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.prisma.expenseTemplate.create({
      data: {
        organization: { connect: { id: orgId } },
        createdBy: { connect: { id: userId } },
        name,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        taxCategory: expense.taxCategory,
        ...(expense.costCodeId
          ? { costCode: { connect: { id: expense.costCodeId } } }
          : {}),
      },
      include: templateInclude,
    });
  }

  async findAll(
    orgId: string,
    query: { search?: string; page: number; limit: number },
  ) {
    const where: any = { organizationId: orgId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { merchantName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.expenseTemplate.findMany({
        where,
        include: templateInclude,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.expenseTemplate.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const template = await this.prisma.expenseTemplate.findFirst({
      where: { id, organizationId: orgId },
      include: templateInclude,
    });
    if (!template) throw new NotFoundException('Expense template not found');
    return template;
  }

  async update(orgId: string, id: string, data: UpdateExpenseTemplateData) {
    await this.findOne(orgId, id);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.taxCategory !== undefined) updateData.taxCategory = data.taxCategory;
    if (data.merchantName !== undefined) updateData.merchantName = data.merchantName;
    if (data.costCodeId !== undefined) {
      updateData.costCode = data.costCodeId
        ? { connect: { id: data.costCodeId } }
        : { disconnect: true };
    }

    return this.prisma.expenseTemplate.update({
      where: { id },
      data: updateData,
      include: templateInclude,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.expenseTemplate.delete({ where: { id } });
  }
}
