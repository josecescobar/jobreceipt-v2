import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import { NotificationService } from '../../common/services/notification.service';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

interface CreateExpenseData {
  jobId: string;
  receiptId?: string | null;
  costCodeId?: string | null;
  amount: number;
  description: string;
  category?: string | null;
  taxCategory?: string | null;
  mileage?: number | null;
  imageKey?: string | null;
  date: string;
}

interface ExpenseQuery {
  jobId?: string;
  category?: string;
  taxCategory?: string;
  status?: 'pending' | 'approved';
  subcontractorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
}

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private notificationService: NotificationService,
  ) {}

  async create(orgId: string, userId: string, data: CreateExpenseData) {
    const expense = await this.prisma.expense.create({
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
        imageKey: data.imageKey,
        date: new Date(data.date),
        createdById: userId,
      },
    });

    // Check budget thresholds (fire-and-forget)
    this.checkBudgetAlert(data.jobId, orgId, data.amount).catch(() => {});

    return expense;
  }

  async createBatch(orgId: string, userId: string, items: CreateExpenseData[]) {
    const expenses = await this.prisma.$transaction(async (tx: any) => {
      const created = [];
      for (const item of items) {
        const expense = await tx.expense.create({
          data: {
            organizationId: orgId,
            jobId: item.jobId,
            receiptId: item.receiptId,
            costCodeId: item.costCodeId,
            amount: item.amount,
            description: item.description,
            category: item.category,
            taxCategory: item.taxCategory,
            mileage: item.mileage,
            imageKey: item.imageKey,
            date: new Date(item.date),
            createdById: userId,
          },
        });
        created.push(expense);
      }
      return created;
    });

    // Fire budget checks for each unique job (fire-and-forget)
    const jobAmounts = new Map<string, number>();
    for (const item of items) {
      const current = jobAmounts.get(item.jobId) || 0;
      jobAmounts.set(item.jobId, current + item.amount);
    }
    for (const [jobId, amount] of jobAmounts) {
      this.checkBudgetAlert(jobId, orgId, amount).catch(() => {});
    }

    return expenses;
  }

  async findAll(orgId: string, query: ExpenseQuery) {
    const where: Prisma.ExpenseWhereInput = { organizationId: orgId };

    if (query.jobId) where.jobId = query.jobId;
    if (query.category) where.category = query.category;
    if (query.taxCategory) where.taxCategory = query.taxCategory;
    if (query.subcontractorId) where.subcontractorId = query.subcontractorId;
    if (query.status === 'pending') where.approvedAt = null;
    if (query.status === 'approved') where.approvedAt = { not: null };

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
          approvedBy: { select: { id: true, name: true } },
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
    if (data.imageKey !== undefined) updateData.imageKey = data.imageKey;
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

  async batchDelete(orgId: string, ids: string[]) {
    const result = await this.prisma.expense.deleteMany({
      where: { id: { in: ids }, organizationId: orgId },
    });
    return { count: result.count };
  }

  async requestUploadUrl(orgId: string, fileName: string, contentType: string) {
    const id = uuid();
    const ext = fileName.split('.').pop() || 'jpg';
    const key = `expenses/${orgId}/${id}/original.${ext}`;
    const { url } = await this.s3Service.generateUploadUrl(key, contentType);
    return { uploadUrl: url, imageKey: key };
  }

  async getImageUrl(imageKey: string): Promise<string> {
    return this.s3Service.generateDownloadUrl(imageKey);
  }

  async batchUpdate(
    orgId: string,
    ids: string[],
    updates: { jobId?: string; category?: string },
  ) {
    const data: Record<string, unknown> = {};
    if (updates.jobId !== undefined) data.jobId = updates.jobId;
    if (updates.category !== undefined) data.category = updates.category;

    const result = await this.prisma.expense.updateMany({
      where: { id: { in: ids }, organizationId: orgId },
      data,
    });
    return { count: result.count };
  }

  async approve(orgId: string, expenseId: string, approverId: string) {
    const expense = await this.findOne(orgId, expenseId);

    const updated = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });

    // Notify creator (fire-and-forget)
    const formatDollars = (cents: number) =>
      `$${(cents / 100).toFixed(2)}`;
    this.notificationService.sendPushNotification(
      expense.createdById,
      'Expense Approved',
      `${expense.description} (${formatDollars(expense.amount)}) has been approved`,
      { screen: 'expenses' },
      'expense_approval',
    ).catch(() => {});

    return updated;
  }

  async reject(orgId: string, expenseId: string) {
    const expense = await this.findOne(orgId, expenseId);

    // Notify creator before deleting (fire-and-forget)
    const formatDollars = (cents: number) =>
      `$${(cents / 100).toFixed(2)}`;
    this.notificationService.sendPushNotification(
      expense.createdById,
      'Expense Rejected',
      `${expense.description} (${formatDollars(expense.amount)}) was rejected`,
      { screen: 'expenses' },
      'expense_approval',
    ).catch(() => {});

    await this.prisma.expense.delete({ where: { id: expenseId } });
  }

  async batchApprove(orgId: string, ids: string[], approverId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { id: { in: ids }, organizationId: orgId, approvedAt: null },
      select: { id: true, createdById: true, description: true, amount: true },
    });

    if (expenses.length === 0) return { count: 0 };

    const result = await this.prisma.$transaction(async (tx: any) => {
      return tx.expense.updateMany({
        where: { id: { in: expenses.map((e) => e.id) }, organizationId: orgId },
        data: { approvedById: approverId, approvedAt: new Date() },
      });
    });

    // Grouped notifications per creator (fire-and-forget)
    const formatDollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const byCreator = new Map<string, typeof expenses>();
    for (const exp of expenses) {
      const list = byCreator.get(exp.createdById) || [];
      list.push(exp);
      byCreator.set(exp.createdById, list);
    }
    for (const [creatorId, creatorExpenses] of byCreator) {
      const total = creatorExpenses.reduce((sum, e) => sum + e.amount, 0);
      this.notificationService.sendPushNotification(
        creatorId,
        'Expenses Approved',
        `${creatorExpenses.length} expense${creatorExpenses.length !== 1 ? 's' : ''} (${formatDollars(total)}) approved`,
        { screen: 'expenses' },
        'expense_approval',
      ).catch(() => {});
    }

    return { count: result.count };
  }

  async batchReject(orgId: string, ids: string[]) {
    const expenses = await this.prisma.expense.findMany({
      where: { id: { in: ids }, organizationId: orgId },
      select: { id: true, createdById: true, description: true, amount: true },
    });

    if (expenses.length === 0) return { count: 0 };

    // Notify creators before deletion (fire-and-forget)
    const formatDollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const byCreator = new Map<string, typeof expenses>();
    for (const exp of expenses) {
      const list = byCreator.get(exp.createdById) || [];
      list.push(exp);
      byCreator.set(exp.createdById, list);
    }
    for (const [creatorId, creatorExpenses] of byCreator) {
      const total = creatorExpenses.reduce((sum, e) => sum + e.amount, 0);
      this.notificationService.sendPushNotification(
        creatorId,
        'Expenses Rejected',
        `${creatorExpenses.length} expense${creatorExpenses.length !== 1 ? 's' : ''} (${formatDollars(total)}) rejected`,
        { screen: 'expenses' },
        'expense_approval',
      ).catch(() => {});
    }

    const result = await this.prisma.$transaction(async (tx: any) => {
      return tx.expense.deleteMany({
        where: { id: { in: expenses.map((e) => e.id) }, organizationId: orgId },
      });
    });

    return { count: result.count };
  }

  async checkBudgetAlert(jobId: string, orgId: string, newExpenseAmount: number): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, name: true, budgetTotal: true, organizationId: true },
    });

    if (!job || !job.budgetTotal || job.budgetTotal <= 0) return;

    const { _sum } = await this.prisma.expense.aggregate({
      where: { jobId, organizationId: orgId },
      _sum: { amount: true },
    });

    const currentTotal = _sum.amount || 0;
    const previousTotal = currentTotal - newExpenseAmount;
    const budget = job.budgetTotal;

    // Find org owner to notify
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { ownerId: true },
    });
    if (!org) return;

    const formatDollars = (cents: number) =>
      `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    // Over budget transition (crossed 100%)
    if (currentTotal >= budget && previousTotal < budget) {
      await this.notificationService.sendPushNotification(
        org.ownerId,
        'Over Budget',
        `${job.name} has exceeded its ${formatDollars(budget)} budget (now at ${formatDollars(currentTotal)})`,
        { jobId: job.id },
        'budget_alert',
      );
      this.logger.log(`Budget alert: ${job.name} is over budget`);
    }
    // Warning transition (crossed 80%)
    else if (currentTotal >= budget * 0.8 && previousTotal < budget * 0.8) {
      await this.notificationService.sendPushNotification(
        org.ownerId,
        'Budget Warning',
        `${job.name} has used ${Math.round((currentTotal / budget) * 100)}% of its ${formatDollars(budget)} budget`,
        { jobId: job.id },
        'budget_alert',
      );
      this.logger.log(`Budget warning: ${job.name} at ${Math.round((currentTotal / budget) * 100)}%`);
    }
  }
}
