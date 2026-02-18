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
      );
      this.logger.log(`Budget warning: ${job.name} at ${Math.round((currentTotal / budget) * 100)}%`);
    }
  }
}
