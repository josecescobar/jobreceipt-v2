import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/request-context/request-context.service';
import { buildPaginatedResponse } from '../common/dto/paginated-response.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  private getOrganizationId(): string {
    const organizationId = this.requestContext.getOrganizationId();
    if (!organizationId) {
      throw new BadRequestException('x-org-id header is required');
    }
    return organizationId;
  }

  async list(query: ListJobsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, totalCount] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return buildPaginatedResponse(data, totalCount, page, limit);
  }

  create(dto: CreateJobDto) {
    const organizationId = this.getOrganizationId();

    return this.prisma.job.create({
      data: {
        organizationId,
        name: dto.name,
        customerName: dto.customerName,
        customerAddress: dto.customerAddress,
        budgetTotalCents: dto.budgetTotalCents ?? 0,
        budgetMaterialsCents: dto.budgetMaterialsCents ?? 0,
        budgetLaborCents: dto.budgetLaborCents ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  async getById(jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async update(jobId: string, dto: UpdateJobDto) {
    const result = await this.prisma.job.updateMany({
      where: {
        id: jobId,
      },
      data: {
        name: dto.name,
        customerName: dto.customerName,
        customerAddress: dto.customerAddress,
        status: dto.status,
        budgetTotalCents: dto.budgetTotalCents,
        budgetMaterialsCents: dto.budgetMaterialsCents,
        budgetLaborCents: dto.budgetLaborCents,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
      },
    });

    if (!result.count) {
      throw new NotFoundException('Job not found');
    }

    return this.getById(jobId);
  }

  async getBudget(jobId: string) {
    const job = await this.getById(jobId);

    const [spentAggregate, byCategory] = await Promise.all([
      this.prisma.expense.aggregate({
        _sum: {
          amountCents: true,
        },
        where: {
          jobId,
        },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        _sum: {
          amountCents: true,
        },
        where: {
          jobId,
        },
      }),
    ]);

    const totalSpent = spentAggregate._sum.amountCents ?? 0;
    const totalBudget = job.budgetTotalCents;
    const remaining = totalBudget - totalSpent;

    const health =
      totalBudget === 0 ? 'UNSET' : totalSpent >= totalBudget ? 'RED' : totalSpent >= totalBudget * 0.8 ? 'YELLOW' : 'GREEN';

    await this.prisma.budgetSnapshot.create({
      data: {
        organizationId: job.organizationId,
        jobId: job.id,
        totalBudgetCents: totalBudget,
        totalSpentCents: totalSpent,
        totalRemainingCents: remaining,
        materialsBudgetCents: job.budgetMaterialsCents,
        materialsSpentCents:
          byCategory.find((entry: { category: string | null; _sum: { amountCents: number | null } }) => entry.category?.toUpperCase() === 'MATERIALS')?._sum.amountCents ??
          0,
        laborBudgetCents: job.budgetLaborCents,
        laborSpentCents:
          byCategory.find((entry: { category: string | null; _sum: { amountCents: number | null } }) => entry.category?.toUpperCase() === 'LABOR')?._sum.amountCents ??
          0,
      },
    });

    return {
      jobId: job.id,
      totalBudgetCents: totalBudget,
      totalSpentCents: totalSpent,
      totalRemainingCents: remaining,
      health,
      byCategory: byCategory.map((entry: { category: string | null; _sum: { amountCents: number | null } }) => ({
        category: entry.category,
        totalSpentCents: entry._sum.amountCents ?? 0,
      })),
    };
  }
}
