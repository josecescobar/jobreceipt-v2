import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CreateExpenseData {
  jobId: string;
  receiptId?: string | null;
  costCodeId?: string | null;
  amount: number;
  description: string;
  category?: string | null;
  taxCategory?: string | null;
  mileage?: number | null;
  date: string;
}

interface ExpenseQuery {
  jobId?: string;
  category?: string;
  taxCategory?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
}

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, data: CreateExpenseData) {
    return this.prisma.expense.create({
      data: {
        organizationId: orgId,
        jobId: data.jobId,
        receiptId: data.receiptId,
        costCodeId: data.costCodeId,
        amount: data.amount,
        description: data.description,
        category: data.category,
        taxCategory: data.taxCategory,
        mileage: data.mileage,
        date: new Date(data.date),
        createdById: userId,
      },
    });
  }

  async findAll(orgId: string, query: ExpenseQuery) {
    const where: Prisma.ExpenseWhereInput = { organizationId: orgId };

    if (query.jobId) where.jobId = query.jobId;
    if (query.category) where.category = query.category;
    if (query.taxCategory) where.taxCategory = query.taxCategory;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.description = { contains: query.search, mode: 'insensitive' };
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { date: 'desc' },
        include: {
          job: { select: { id: true, name: true } },
          costCode: { select: { id: true, code: true, name: true, category: true } },
          receipt: { select: { id: true, thumbnailUrl: true, merchantName: true } },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { data: expenses, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, organizationId: orgId },
      include: {
        job: { select: { id: true, name: true } },
        costCode: true,
        receipt: { select: { id: true, imageUrl: true, merchantName: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async update(orgId: string, id: string, data: Partial<CreateExpenseData>) {
    await this.findOne(orgId, id);

    const updateData: Prisma.ExpenseUpdateInput = {};
    if (data.jobId !== undefined) updateData.job = { connect: { id: data.jobId } };
    if (data.costCodeId !== undefined) {
      updateData.costCode = data.costCodeId ? { connect: { id: data.costCodeId } } : { disconnect: true };
    }
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.taxCategory !== undefined) updateData.taxCategory = data.taxCategory;
    if (data.mileage !== undefined) updateData.mileage = data.mileage;
    if (data.date !== undefined) updateData.date = new Date(data.date);

    return this.prisma.expense.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.expense.delete({ where: { id } });
  }
}
