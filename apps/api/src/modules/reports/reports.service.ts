import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SCHEDULE_C_CATEGORIES, IRS_MILEAGE_RATE_DOLLARS } from '@jobreceipt/shared';
import type { ReportTemplate } from '@jobreceipt/shared';

interface ReportDateRange {
  start: string;
  end: string;
}

interface ReportConfig {
  dateRange: ReportDateRange;
  jobIds?: string[];
  categories?: string[];
  crewUserIds?: string[];
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  getTemplates(): ReportTemplate[] {
    return [
      {
        type: 'job_summary',
        label: 'Job Summary',
        description: 'Expenses, labor, materials, and budget vs actual per job',
        icon: 'briefcase-outline',
      },
      {
        type: 'profitability',
        label: 'Profitability Report',
        description: 'Revenue, expenses, labor costs, and margin by job',
        icon: 'trending-up-outline',
      },
      {
        type: 'labor_hours',
        label: 'Labor Hours Report',
        description: 'Hours worked by crew member and job with overtime',
        icon: 'time-outline',
      },
      {
        type: 'expense_detail',
        label: 'Expense Detail',
        description: 'All expenses with dates, jobs, categories, and amounts',
        icon: 'receipt-outline',
      },
      {
        type: 'tax_deductions',
        label: 'Tax Deductions',
        description: 'Schedule C categories, mileage, and tax deduction totals',
        icon: 'calculator-outline',
      },
    ];
  }

  async getJobSummaryData(orgId: string, config: ReportConfig) {
    const startDate = new Date(config.dateRange.start);
    const endDate = new Date(config.dateRange.end);

    const jobWhere: Prisma.JobWhereInput = {
      organizationId: orgId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
    };
    if (config.jobIds && config.jobIds.length > 0) {
      jobWhere.id = { in: config.jobIds };
    }

    const jobs = await this.prisma.job.findMany({
      where: jobWhere,
      select: {
        id: true,
        name: true,
        budgetTotal: true,
      },
    });

    if (jobs.length === 0) return [];

    const jobIds = jobs.map((j) => j.id);

    const expenseWhere: Prisma.ExpenseWhereInput = {
      organizationId: orgId,
      jobId: { in: jobIds },
      date: { gte: startDate, lte: endDate },
    };

    const timeEntryWhere: Prisma.TimeEntryWhereInput = {
      organizationId: orgId,
      jobId: { in: jobIds },
      date: { gte: startDate, lte: endDate },
    };

    const [expensesByJob, expensesWithCategory, timeEntriesByJob] =
      await Promise.all([
        this.prisma.expense.groupBy({
          by: ['jobId'],
          where: expenseWhere,
          _sum: { amount: true },
        }),
        this.prisma.expense.findMany({
          where: expenseWhere,
          select: {
            jobId: true,
            amount: true,
            costCode: { select: { category: true } },
          },
        }),
        this.prisma.timeEntry.groupBy({
          by: ['jobId'],
          where: timeEntryWhere,
          _sum: { totalCost: true, durationMinutes: true },
        }),
      ]);

    const expenseMap = new Map(
      expensesByJob.map((g) => [g.jobId, g._sum.amount ?? 0]),
    );

    const materialMap = new Map<string, number>();
    for (const exp of expensesWithCategory) {
      const cat = exp.costCode?.category || 'MATERIALS';
      if (cat === 'MATERIALS' || cat === 'SUBCONTRACTOR') {
        materialMap.set(
          exp.jobId,
          (materialMap.get(exp.jobId) ?? 0) + exp.amount,
        );
      }
    }

    const laborMap = new Map(
      timeEntriesByJob.map((g) => [
        g.jobId,
        {
          hours: Math.round((g._sum.durationMinutes ?? 0) / 6) / 10,
          cost: g._sum.totalCost ?? 0,
        },
      ]),
    );

    return jobs.map((job) => {
      const totalExpenses = expenseMap.get(job.id) ?? 0;
      const labor = laborMap.get(job.id) ?? { hours: 0, cost: 0 };
      const materialCost = materialMap.get(job.id) ?? 0;
      const budget = job.budgetTotal ?? 0;
      const budgetUsedPct =
        budget > 0
          ? Math.round(((totalExpenses + labor.cost) / budget) * 10000) / 100
          : 0;

      return {
        jobName: job.name,
        totalExpenses,
        laborHours: labor.hours,
        laborCost: labor.cost,
        materialCost,
        budget,
        budgetUsedPct,
      };
    });
  }

  async getProfitabilityData(orgId: string, config: ReportConfig) {
    const startDate = new Date(config.dateRange.start);
    const endDate = new Date(config.dateRange.end);

    const jobWhere: Prisma.JobWhereInput = {
      organizationId: orgId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
    };
    if (config.jobIds && config.jobIds.length > 0) {
      jobWhere.id = { in: config.jobIds };
    }

    const jobs = await this.prisma.job.findMany({
      where: jobWhere,
      select: {
        id: true,
        name: true,
        contractValue: true,
      },
    });

    if (jobs.length === 0) return [];

    const jobIds = jobs.map((j) => j.id);

    const [expensesByJob, timeEntriesByJob] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['jobId'],
        where: {
          organizationId: orgId,
          jobId: { in: jobIds },
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.timeEntry.groupBy({
        by: ['jobId'],
        where: {
          organizationId: orgId,
          jobId: { in: jobIds },
          date: { gte: startDate, lte: endDate },
        },
        _sum: { totalCost: true },
      }),
    ]);

    const expenseMap = new Map(
      expensesByJob.map((g) => [g.jobId, g._sum.amount ?? 0]),
    );
    const laborMap = new Map(
      timeEntriesByJob.map((g) => [g.jobId, g._sum.totalCost ?? 0]),
    );

    return jobs.map((job) => {
      const contractValue = job.contractValue ?? 0;
      const totalExpenses = expenseMap.get(job.id) ?? 0;
      const laborCost = laborMap.get(job.id) ?? 0;
      const totalCost = totalExpenses + laborCost;
      const netProfit = contractValue - totalCost;
      const marginPct =
        contractValue > 0
          ? Math.round((netProfit / contractValue) * 10000) / 100
          : 0;

      return {
        jobName: job.name,
        contractValue,
        totalExpenses,
        laborCost,
        netProfit,
        marginPct,
      };
    });
  }

  async getLaborHoursData(orgId: string, config: ReportConfig) {
    const startDate = new Date(config.dateRange.start);
    const endDate = new Date(config.dateRange.end);

    const where: Prisma.TimeEntryWhereInput = {
      organizationId: orgId,
      date: { gte: startDate, lte: endDate },
    };
    if (config.jobIds && config.jobIds.length > 0) {
      where.jobId = { in: config.jobIds };
    }
    if (config.crewUserIds && config.crewUserIds.length > 0) {
      where.userId = { in: config.crewUserIds };
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      select: {
        date: true,
        durationMinutes: true,
        overtimeMinutes: true,
        hourlyRate: true,
        totalCost: true,
        user: { select: { name: true, email: true } },
        job: { select: { name: true } },
      },
      orderBy: [{ date: 'asc' }],
    });

    return entries.map((e) => ({
      crewMember: e.user.name || e.user.email,
      jobName: e.job.name,
      date: e.date.toISOString().split('T')[0],
      hours: Math.round((e.durationMinutes / 60) * 100) / 100,
      overtimeHours:
        Math.round((e.overtimeMinutes / 60) * 100) / 100,
      hourlyRate: e.hourlyRate,
      totalCost: e.totalCost,
    }));
  }

  async getExpenseDetailData(orgId: string, config: ReportConfig) {
    const startDate = new Date(config.dateRange.start);
    const endDate = new Date(config.dateRange.end);

    const where: Prisma.ExpenseWhereInput = {
      organizationId: orgId,
      date: { gte: startDate, lte: endDate },
    };
    if (config.jobIds && config.jobIds.length > 0) {
      where.jobId = { in: config.jobIds };
    }
    if (config.categories && config.categories.length > 0) {
      where.category = { in: config.categories };
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      select: {
        date: true,
        description: true,
        amount: true,
        category: true,
        taxCategory: true,
        job: { select: { name: true } },
        receipt: { select: { merchantName: true } },
      },
      orderBy: { date: 'asc' },
    });

    return expenses.map((e) => ({
      date: e.date.toISOString().split('T')[0],
      jobName: e.job.name,
      category: e.category || 'Uncategorized',
      description: e.description,
      merchant: e.receipt?.merchantName || '',
      amount: e.amount,
      taxCategory: e.taxCategory || '',
    }));
  }

  async getTaxDeductionsData(orgId: string, config: ReportConfig) {
    const startDate = new Date(config.dateRange.start);
    const endDate = new Date(config.dateRange.end);

    const expenseWhere: Prisma.ExpenseWhereInput = {
      organizationId: orgId,
      date: { gte: startDate, lte: endDate },
    };
    if (config.jobIds && config.jobIds.length > 0) {
      expenseWhere.jobId = { in: config.jobIds };
    }

    const [taxGroups, mileageAgg] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['taxCategory'],
        where: expenseWhere,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.mileageTrip.aggregate({
        where: {
          organizationId: orgId,
          date: { gte: startDate, lte: endDate },
          ...(config.jobIds && config.jobIds.length > 0
            ? { jobId: { in: config.jobIds } }
            : {}),
        },
        _sum: { totalDeduction: true, distanceMiles: true },
      }),
    ]);

    const rows = taxGroups.map((g) => {
      const key = g.taxCategory || 'line_27';
      const category = SCHEDULE_C_CATEGORIES[key];
      return {
        taxCategory: category?.name || 'Other expenses',
        totalAmount: g._sum.amount ?? 0,
        transactionCount: g._count,
      };
    });

    // Add mileage as a row if there's any
    const totalMileageDeduction = mileageAgg._sum.totalDeduction ?? 0;
    const totalMiles = mileageAgg._sum.distanceMiles ?? 0;
    if (totalMileageDeduction > 0) {
      rows.push({
        taxCategory: `Mileage (${totalMiles.toFixed(1)} mi @ $${IRS_MILEAGE_RATE_DOLLARS}/mi)`,
        totalAmount: totalMileageDeduction,
        transactionCount: 0,
      });
    }

    return rows;
  }
}
