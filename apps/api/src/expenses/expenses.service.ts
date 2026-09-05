import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { RequestContextService } from '../common/request-context/request-context.service';
import { buildPaginatedResponse } from '../common/dto/paginated-response.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  private organizationId(): string {
    const organizationId = this.requestContext.getOrganizationId();
    if (!organizationId) {
      throw new BadRequestException('x-org-id header is required');
    }

    return organizationId;
  }

  private async ensureUser(auth: RequestUser): Promise<{ id: string }> {
    return this.prisma.user.upsert({
      where: { clerkId: auth.clerkId },
      create: {
        clerkId: auth.clerkId,
        email: `${auth.clerkId}@jobreceipt.local`,
        role: UserRole.OWNER,
      },
      update: {},
      select: { id: true },
    });
  }

  async create(auth: RequestUser, dto: CreateExpenseDto) {
    const organizationId = this.organizationId();

    const job = await this.prisma.job.findFirst({
      where: {
        id: dto.jobId,
      },
      select: { id: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const user = await this.ensureUser(auth);

    return this.prisma.expense.create({
      data: {
        organizationId,
        jobId: dto.jobId,
        costCodeId: dto.costCodeId,
        amountCents: dto.amountCents,
        description: dto.description,
        category: dto.category,
        taxCategory: dto.taxCategory,
        date: new Date(dto.date),
        createdById: user.id,
      },
    });
  }

  async list(query: ListExpensesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.jobId ? { jobId: query.jobId } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.startDate || query.endDate
        ? {
            date: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const [data, totalCount] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return buildPaginatedResponse(data, totalCount, page, limit);
  }

  async getById(expenseId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async update(expenseId: string, dto: UpdateExpenseDto) {
    if (dto.jobId) {
      const job = await this.prisma.job.findFirst({
        where: { id: dto.jobId },
        select: { id: true },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }
    }

    const result = await this.prisma.expense.updateMany({
      where: { id: expenseId },
      data: {
        ...(dto.jobId !== undefined ? { jobId: dto.jobId } : {}),
        ...(dto.costCodeId !== undefined ? { costCodeId: dto.costCodeId } : {}),
        ...(dto.amountCents !== undefined ? { amountCents: dto.amountCents } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.taxCategory !== undefined ? { taxCategory: dto.taxCategory } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Expense not found');
    }

    return this.getById(expenseId);
  }

  async remove(expenseId: string) {
    const result = await this.prisma.expense.deleteMany({
      where: { id: expenseId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Expense not found');
    }

    return { deleted: true };
  }
}
