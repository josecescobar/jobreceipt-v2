import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, RecurringExpenseFrequency } from '@prisma/client';

interface CreateRecurringExpenseData {
  jobId: string;
  costCodeId?: string;
  amount: number;
  description: string;
  category?: string;
  taxCategory?: string;
  frequency: RecurringExpenseFrequency;
  startDate: string;
  endDate?: string;
}

interface UpdateRecurringExpenseData {
  jobId?: string;
  costCodeId?: string;
  amount?: number;
  description?: string;
  category?: string;
  taxCategory?: string;
  frequency?: RecurringExpenseFrequency;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

@Injectable()
export class RecurringExpensesService {
  private readonly logger = new Logger(RecurringExpensesService.name);

  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, data: CreateRecurringExpenseData) {
    return this.prisma.recurringExpense.create({
      data: {
        organizationId: orgId,
        jobId: data.jobId,
        costCodeId: data.costCodeId || null,
        amount: data.amount,
        description: data.description,
        category: data.category || null,
        taxCategory: data.taxCategory || null,
        frequency: data.frequency,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        nextOccurrence: new Date(data.startDate),
        createdById: userId,
      },
      include: {
        job: { select: { id: true, name: true } },
        costCode: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async findAll(orgId: string, query: { isActive?: string; jobId?: string; page: number; limit: number }) {
    const where: Prisma.RecurringExpenseWhereInput = { organizationId: orgId };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }
    if (query.jobId) {
      where.jobId = query.jobId;
    }

    const [data, total] = await Promise.all([
      this.prisma.recurringExpense.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { id: true, name: true } },
          costCode: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prisma.recurringExpense.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const item = await this.prisma.recurringExpense.findFirst({
      where: { id, organizationId: orgId },
      include: {
        job: { select: { id: true, name: true } },
        costCode: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!item) throw new NotFoundException('Recurring expense not found');
    return item;
  }

  async update(orgId: string, id: string, data: UpdateRecurringExpenseData) {
    await this.findOne(orgId, id);

    const updateData: Prisma.RecurringExpenseUpdateInput = {};
    if (data.jobId !== undefined) updateData.job = { connect: { id: data.jobId } };
    if (data.costCodeId !== undefined) {
      updateData.costCode = data.costCodeId ? { connect: { id: data.costCodeId } } : { disconnect: true };
    }
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.taxCategory !== undefined) updateData.taxCategory = data.taxCategory;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.recurringExpense.update({
      where: { id },
      data: updateData,
      include: {
        job: { select: { id: true, name: true } },
        costCode: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.recurringExpense.delete({ where: { id } });
  }

  async processDueRecurringExpenses(): Promise<{ processed: number; errors: number }> {
    const now = new Date();
    const dueItems = await this.prisma.recurringExpense.findMany({
      where: {
        isActive: true,
        nextOccurrence: { lte: now },
      },
    });

    this.logger.log(`Found ${dueItems.length} due recurring expenses`);
    let processed = 0;
    let errors = 0;

    for (const item of dueItems) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Create the actual expense
          await tx.expense.create({
            data: {
              organizationId: item.organizationId,
              jobId: item.jobId,
              costCodeId: item.costCodeId,
              amount: item.amount,
              description: item.description,
              category: item.category,
              taxCategory: item.taxCategory,
              date: item.nextOccurrence,
              createdById: item.createdById,
            },
          });

          // Compute next occurrence
          const nextDate = this.computeNextOccurrence(item.nextOccurrence, item.frequency);

          // Deactivate if past end date
          const shouldDeactivate = item.endDate && nextDate > item.endDate;

          await tx.recurringExpense.update({
            where: { id: item.id },
            data: {
              lastCreatedAt: now,
              nextOccurrence: nextDate,
              isActive: shouldDeactivate ? false : undefined,
            },
          });
        });

        processed++;
      } catch (err) {
        errors++;
        this.logger.error(`Failed to process recurring expense ${item.id}: ${err}`);
      }
    }

    this.logger.log(`Processed ${processed}, errors ${errors}`);
    return { processed, errors };
  }

  private computeNextOccurrence(current: Date, frequency: RecurringExpenseFrequency): Date {
    const next = new Date(current);
    switch (frequency) {
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'BIWEEKLY':
        next.setDate(next.getDate() + 14);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }
}
