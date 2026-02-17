import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(orgId: string, query: AnalyticsQuery) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const expenseDateFilter = this.buildDateFilter(startDate, endDate, 'date');
    const receiptDateFilter = this.buildDateFilter(startDate, endDate, 'createdAt');
    const mileageDateFilter = this.buildDateFilter(startDate, endDate, 'date');

    const [
      expenseAgg,
      mileageAgg,
      receiptCount,
      monthlySpending,
      categoryBreakdown,
      topJobs,
    ] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { organizationId: orgId, ...expenseDateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.mileageTrip.aggregate({
        where: { organizationId: orgId, ...mileageDateFilter },
        _sum: { totalDeduction: true, distanceMiles: true },
        _count: true,
      }),
      this.prisma.receipt.count({
        where: { organizationId: orgId, ...receiptDateFilter },
      }),
      this.getMonthlySpending(orgId, startDate, endDate),
      this.getCategoryBreakdown(orgId, startDate, endDate),
      this.getTopJobs(orgId, startDate, endDate),
    ]);

    return {
      period: {
        startDate: startDate?.toISOString() ?? null,
        endDate: endDate?.toISOString() ?? null,
      },
      totals: {
        totalExpenses: expenseAgg._sum.amount ?? 0,
        totalMileageDeductions: mileageAgg._sum.totalDeduction ?? 0,
        receiptCount,
        expenseCount: expenseAgg._count,
        tripCount: mileageAgg._count,
      },
      monthlySpending,
      categoryBreakdown,
      topJobs,
    };
  }

  private buildDateFilter(
    startDate?: Date,
    endDate?: Date,
    field: string = 'date',
  ): Record<string, any> {
    if (!startDate && !endDate) return {};
    const filter: Record<string, any> = {};
    filter[field] = {};
    if (startDate) filter[field].gte = startDate;
    if (endDate) filter[field].lte = endDate;
    return filter;
  }

  private async getMonthlySpending(orgId: string, startDate?: Date, endDate?: Date) {
    const conditions = [Prisma.sql`"organizationId" = ${orgId}`];
    if (startDate) conditions.push(Prisma.sql`date >= ${startDate}`);
    if (endDate) conditions.push(Prisma.sql`date <= ${endDate}`);

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    const rows: Array<{ month: string; total: bigint }> = await this.prisma.$queryRaw`
      SELECT to_char(date_trunc('month', date), 'YYYY-MM') as month,
             SUM(amount) as total
      FROM "Expense"
      ${whereClause}
      GROUP BY date_trunc('month', date)
      ORDER BY date_trunc('month', date)
    `;

    return rows.map((r) => ({
      month: r.month,
      total: Number(r.total),
    }));
  }

  private async getCategoryBreakdown(orgId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.ExpenseWhereInput = { organizationId: orgId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const groups = await this.prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    const totalAmount = groups.reduce((sum, g) => sum + (g._sum.amount ?? 0), 0);

    return groups.map((g) => ({
      category: g.category || 'Uncategorized',
      total: g._sum.amount ?? 0,
      count: g._count,
      percentage:
        totalAmount > 0
          ? Math.round(((g._sum.amount ?? 0) / totalAmount) * 10000) / 100
          : 0,
    }));
  }

  private async getTopJobs(orgId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.ExpenseWhereInput = { organizationId: orgId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const groups = await this.prisma.expense.groupBy({
      by: ['jobId'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    const jobIds = groups.map((g) => g.jobId);
    const jobs = await this.prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, name: true },
    });
    const jobNameMap = new Map(jobs.map((j) => [j.id, j.name]));

    return groups.map((g) => ({
      jobId: g.jobId,
      jobName: jobNameMap.get(g.jobId) || 'Unknown Job',
      totalSpent: g._sum.amount ?? 0,
      expenseCount: g._count,
    }));
  }
}
