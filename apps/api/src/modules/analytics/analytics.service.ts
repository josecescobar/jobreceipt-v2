import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SCHEDULE_C_CATEGORIES,
  IRS_MILEAGE_RATE_DOLLARS,
  SELF_EMPLOYMENT_TAX_RATE,
} from '@jobreceipt/shared';

interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getWeeklyComparison(orgId: string) {
    const now = new Date();
    // ISO week: Monday = start of week
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - diffToMonday);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setMilliseconds(-1);

    const [thisWeekAgg, lastWeekAgg] = await Promise.all([
      this.prisma.expense.aggregate({
        where: {
          organizationId: orgId,
          date: { gte: thisWeekStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          organizationId: orgId,
          date: { gte: lastWeekStart, lte: lastWeekEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const thisWeek = thisWeekAgg._sum.amount ?? 0;
    const lastWeek = lastWeekAgg._sum.amount ?? 0;

    let changePercent: number | null = null;
    if (lastWeek > 0) {
      changePercent = Math.round(((thisWeek - lastWeek) / lastWeek) * 10000) / 100;
    } else if (thisWeek > 0) {
      changePercent = 100;
    }

    return { thisWeek, lastWeek, changePercent };
  }

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
      topMerchants,
      budgetHealth,
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
      this.getTopMerchants(orgId, startDate, endDate),
      this.getBudgetHealth(orgId),
    ]);

    const currentTotals = {
      totalExpenses: expenseAgg._sum.amount ?? 0,
      totalMileageDeductions: mileageAgg._sum.totalDeduction ?? 0,
      receiptCount,
    };

    const periodComparison = await this.getPeriodComparison(
      orgId,
      currentTotals,
      startDate,
      endDate,
    );

    return {
      period: {
        startDate: startDate?.toISOString() ?? null,
        endDate: endDate?.toISOString() ?? null,
      },
      totals: {
        ...currentTotals,
        expenseCount: expenseAgg._count,
        tripCount: mileageAgg._count,
      },
      monthlySpending,
      categoryBreakdown,
      topJobs,
      topMerchants,
      periodComparison,
      budgetHealth,
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

  private async getTopMerchants(orgId: string, startDate?: Date, endDate?: Date) {
    const conditions = [
      Prisma.sql`e."organizationId" = ${orgId}`,
      Prisma.sql`e."receiptId" IS NOT NULL`,
      Prisma.sql`r."merchantName" IS NOT NULL`,
      Prisma.sql`r."merchantName" != ''`,
    ];
    if (startDate) conditions.push(Prisma.sql`e.date >= ${startDate}`);
    if (endDate) conditions.push(Prisma.sql`e.date <= ${endDate}`);

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    const rows: Array<{ merchant_name: string; total: bigint; receipt_count: bigint }> =
      await this.prisma.$queryRaw`
        SELECT r."merchantName" as merchant_name,
               SUM(e.amount) as total,
               COUNT(DISTINCT e."receiptId") as receipt_count
        FROM "Expense" e
        JOIN "Receipt" r ON r.id = e."receiptId"
        ${whereClause}
        GROUP BY r."merchantName"
        ORDER BY SUM(e.amount) DESC
        LIMIT 10
      `;

    const grandTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);

    return rows.map((r) => ({
      merchantName: r.merchant_name,
      totalSpent: Number(r.total),
      receiptCount: Number(r.receipt_count),
      percentage:
        grandTotal > 0
          ? Math.round((Number(r.total) / grandTotal) * 10000) / 100
          : 0,
    }));
  }

  private async getPeriodComparison(
    orgId: string,
    currentTotals: { totalExpenses: number; totalMileageDeductions: number; receiptCount: number },
    startDate?: Date,
    endDate?: Date,
  ) {
    // No meaningful comparison for "All Time"
    if (!startDate) {
      return {
        totalExpensesPrevious: 0,
        expensesDelta: null,
        totalMileageDeductionsPrevious: 0,
        mileageDelta: null,
        receiptCountPrevious: 0,
        receiptsDelta: null,
      };
    }

    const effectiveEnd = endDate ?? new Date();
    const durationMs = effectiveEnd.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const prevExpenseFilter = this.buildDateFilter(prevStart, prevEnd, 'date');
    const prevMileageFilter = this.buildDateFilter(prevStart, prevEnd, 'date');
    const prevReceiptFilter = this.buildDateFilter(prevStart, prevEnd, 'createdAt');

    const [prevExpense, prevMileage, prevReceipt] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { organizationId: orgId, ...prevExpenseFilter },
        _sum: { amount: true },
      }),
      this.prisma.mileageTrip.aggregate({
        where: { organizationId: orgId, ...prevMileageFilter },
        _sum: { totalDeduction: true },
      }),
      this.prisma.receipt.count({
        where: { organizationId: orgId, ...prevReceiptFilter },
      }),
    ]);

    const calcDelta = (current: number, previous: number): number | null => {
      if (previous === 0) return current > 0 ? 100 : null;
      return Math.round(((current - previous) / previous) * 10000) / 100;
    };

    const prevExpenseTotal = prevExpense._sum.amount ?? 0;
    const prevMileageTotal = prevMileage._sum.totalDeduction ?? 0;

    return {
      totalExpensesPrevious: prevExpenseTotal,
      expensesDelta: calcDelta(currentTotals.totalExpenses, prevExpenseTotal),
      totalMileageDeductionsPrevious: prevMileageTotal,
      mileageDelta: calcDelta(currentTotals.totalMileageDeductions, prevMileageTotal),
      receiptCountPrevious: prevReceipt,
      receiptsDelta: calcDelta(currentTotals.receiptCount, prevReceipt),
    };
  }

  private async getBudgetHealth(orgId: string) {
    const jobs = await this.prisma.job.findMany({
      where: {
        organizationId: orgId,
        status: 'ACTIVE',
        budgetTotal: { not: null, gt: 0 },
      },
      select: { id: true, name: true, budgetTotal: true },
    });

    if (jobs.length === 0) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        healthyCount: 0,
        warningCount: 0,
        overBudgetCount: 0,
        jobs: [],
      };
    }

    const jobIds = jobs.map((j) => j.id);
    const expensesByJob = await this.prisma.expense.groupBy({
      by: ['jobId'],
      where: { organizationId: orgId, jobId: { in: jobIds } },
      _sum: { amount: true },
    });

    const spentMap = new Map(expensesByJob.map((g) => [g.jobId, g._sum.amount ?? 0]));

    let totalBudget = 0;
    let totalSpent = 0;
    let healthyCount = 0;
    let warningCount = 0;
    let overBudgetCount = 0;

    const budgetJobs = jobs.map((job) => {
      const budget = job.budgetTotal!;
      const spent = spentMap.get(job.id) ?? 0;
      const ratio = budget > 0 ? spent / budget : 0;

      totalBudget += budget;
      totalSpent += spent;

      let status: 'good' | 'warning' | 'over';
      if (ratio >= 1) {
        status = 'over';
        overBudgetCount++;
      } else if (ratio >= 0.75) {
        status = 'warning';
        warningCount++;
      } else {
        status = 'good';
        healthyCount++;
      }

      return {
        jobId: job.id,
        jobName: job.name,
        budgetTotal: budget,
        totalSpent: spent,
        utilizationRatio: Math.round(ratio * 100) / 100,
        status,
      };
    });

    budgetJobs.sort((a, b) => b.utilizationRatio - a.utilizationRatio);

    return {
      totalBudget,
      totalSpent,
      healthyCount,
      warningCount,
      overBudgetCount,
      jobs: budgetJobs,
    };
  }

  async getTaxSummary(orgId: string, year: number) {
    const yearStart = new Date(`${year}-01-01`);
    const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

    const [taxGroups, mileageAgg] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['taxCategory'],
        where: {
          organizationId: orgId,
          date: { gte: yearStart, lte: yearEnd },
        },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.mileageTrip.aggregate({
        where: {
          organizationId: orgId,
          date: { gte: yearStart, lte: yearEnd },
        },
        _sum: { totalDeduction: true, distanceMiles: true },
      }),
    ]);

    const taxCategoryBreakdown = taxGroups.map((g) => {
      const key = g.taxCategory || 'line_27';
      const category = SCHEDULE_C_CATEGORIES[key];
      const lineNum = key.replace('line_', '');
      return {
        taxCategory: key,
        scheduleLine: `Line ${lineNum}`,
        name: category?.name || 'Other expenses',
        total: g._sum.amount ?? 0,
        count: g._count,
      };
    });

    const totalExpenseDeductions = taxGroups.reduce(
      (sum, g) => sum + (g._sum.amount ?? 0),
      0,
    );
    const totalMileageDeductions = mileageAgg._sum.totalDeduction ?? 0;
    const grandTotal = totalExpenseDeductions + totalMileageDeductions;
    const estimatedSETaxSavings = Math.round(grandTotal * SELF_EMPLOYMENT_TAX_RATE);

    return {
      year,
      taxCategoryBreakdown,
      mileage: {
        totalMiles: mileageAgg._sum.distanceMiles ?? 0,
        ratePerMile: IRS_MILEAGE_RATE_DOLLARS,
        totalDeduction: totalMileageDeductions,
      },
      totals: {
        totalExpenseDeductions,
        totalMileageDeductions,
        grandTotal,
        estimatedSETaxSavings,
      },
    };
  }

  async getJobProfitability(orgId: string, query: AnalyticsQuery) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const jobs = await this.prisma.job.findMany({
      where: {
        organizationId: orgId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      select: {
        id: true,
        name: true,
        status: true,
        contractValue: true,
        budgetTotal: true,
        customerName: true,
      },
    });

    if (jobs.length === 0) {
      return {
        jobs: [],
        totals: { totalRevenue: 0, totalExpenses: 0, totalProfit: 0, avgMargin: null },
      };
    }

    const expenseWhere: Prisma.ExpenseWhereInput = {
      organizationId: orgId,
      jobId: { in: jobs.map((j) => j.id) },
    };
    if (startDate || endDate) {
      expenseWhere.date = {};
      if (startDate) expenseWhere.date.gte = startDate;
      if (endDate) expenseWhere.date.lte = endDate;
    }

    // Aggregate expenses per job
    const timeEntryWhere: Prisma.TimeEntryWhereInput = {
      organizationId: orgId,
      jobId: { in: jobs.map((j) => j.id) },
    };
    if (startDate || endDate) {
      timeEntryWhere.date = {};
      if (startDate) timeEntryWhere.date.gte = startDate;
      if (endDate) timeEntryWhere.date.lte = endDate;
    }

    const [expensesByJob, expensesWithCategory, timeEntriesByJob] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['jobId'],
        where: expenseWhere,
        _sum: { amount: true },
        _count: true,
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
        _count: true,
      }),
    ]);

    const jobCategoryMap = new Map<string, Record<string, number>>();
    for (const exp of expensesWithCategory) {
      const cat = exp.costCode?.category || 'MATERIALS';
      if (!jobCategoryMap.has(exp.jobId)) jobCategoryMap.set(exp.jobId, {});
      const catMap = jobCategoryMap.get(exp.jobId)!;
      catMap[cat] = (catMap[cat] || 0) + exp.amount;
    }

    const laborMap = new Map(
      timeEntriesByJob.map((g) => [
        g.jobId,
        { totalCost: g._sum.totalCost ?? 0, totalMinutes: g._sum.durationMinutes ?? 0, count: g._count },
      ]),
    );

    const spentMap = new Map(
      expensesByJob.map((g) => [g.jobId, { total: g._sum.amount ?? 0, count: g._count }]),
    );

    let totalRevenue = 0;
    let totalExpenses = 0;
    let jobsWithMargin = 0;
    let marginSum = 0;

    const profitabilityJobs = jobs.map((job) => {
      const materialSpent = spentMap.get(job.id)?.total ?? 0;
      const expenseCount = spentMap.get(job.id)?.count ?? 0;
      const labor = laborMap.get(job.id);
      const laborCost = labor?.totalCost ?? 0;
      const laborMinutes = labor?.totalMinutes ?? 0;
      const spent = materialSpent + laborCost;
      const revenue = job.contractValue ?? 0;
      const profit = revenue - spent;
      const marginPercent =
        revenue > 0
          ? Math.round(((revenue - spent) / revenue) * 10000) / 100
          : null;

      totalRevenue += revenue;
      totalExpenses += spent;
      if (marginPercent !== null) {
        marginSum += marginPercent;
        jobsWithMargin++;
      }

      const categories = jobCategoryMap.get(job.id) ?? {};
      if (laborCost > 0) {
        categories['LABOR'] = (categories['LABOR'] || 0) + laborCost;
      }

      return {
        jobId: job.id,
        jobName: job.name,
        customerName: job.customerName,
        status: job.status,
        contractValue: revenue,
        totalExpenses: spent,
        expenseCount,
        laborCost,
        laborHours: Math.round(laborMinutes / 6) / 10, // 1 decimal place
        netProfit: profit,
        profitMarginPercent: marginPercent,
        budgetTotal: job.budgetTotal ?? 0,
        expensesByCategory: categories,
      };
    });

    // Sort: highest margin first, jobs without contract at end
    profitabilityJobs.sort((a, b) => {
      if (a.profitMarginPercent === null && b.profitMarginPercent === null) return 0;
      if (a.profitMarginPercent === null) return 1;
      if (b.profitMarginPercent === null) return -1;
      return b.profitMarginPercent - a.profitMarginPercent;
    });

    return {
      jobs: profitabilityJobs,
      totals: {
        totalRevenue,
        totalExpenses,
        totalProfit: totalRevenue - totalExpenses,
        avgMargin:
          jobsWithMargin > 0
            ? Math.round((marginSum / jobsWithMargin) * 100) / 100
            : null,
      },
    };
  }

  async getCalendarData(
    orgId: string,
    query: { startDate: string; endDate: string; jobId?: string },
  ) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    const jobFilter = query.jobId ? { jobId: query.jobId } : {};

    const [expenses, timeEntries, mileageTrips, invoices, recurringExpenses] =
      await Promise.all([
        this.prisma.expense.findMany({
          where: {
            organizationId: orgId,
            date: { gte: start, lte: end },
            ...jobFilter,
          },
          select: { id: true, date: true, description: true, amount: true },
          orderBy: { date: 'asc' },
        }),
        this.prisma.timeEntry.findMany({
          where: {
            organizationId: orgId,
            date: { gte: start, lte: end },
            ...jobFilter,
          },
          select: { id: true, date: true, durationMinutes: true, totalCost: true },
          orderBy: { date: 'asc' },
        }),
        this.prisma.mileageTrip.findMany({
          where: {
            organizationId: orgId,
            date: { gte: start, lte: end },
            ...jobFilter,
          },
          select: { id: true, date: true, distanceMiles: true, totalDeduction: true, purpose: true },
          orderBy: { date: 'asc' },
        }),
        this.prisma.invoice.findMany({
          where: {
            organizationId: orgId,
            dueDate: { gte: start, lte: end },
            status: { in: ['SENT', 'PARTIALLY_PAID'] },
            ...jobFilter,
          },
          select: { id: true, dueDate: true, invoiceNumber: true, total: true },
          orderBy: { dueDate: 'asc' },
        }),
        this.prisma.recurringExpense.findMany({
          where: {
            organizationId: orgId,
            isActive: true,
            nextOccurrence: { gte: start, lte: end },
            ...jobFilter,
          },
          select: { id: true, nextOccurrence: true, description: true, amount: true },
          orderBy: { nextOccurrence: 'asc' },
        }),
      ]);

    const days: Record<string, Array<{ id: string; type: string; title: string; amount?: number }>> = {};

    const toDateKey = (d: Date | string) => new Date(d).toISOString().split('T')[0];
    const addEvent = (dateKey: string, event: { id: string; type: string; title: string; amount?: number }) => {
      if (!days[dateKey]) days[dateKey] = [];
      days[dateKey].push(event);
    };

    for (const e of expenses) {
      addEvent(toDateKey(e.date), {
        id: e.id,
        type: 'expense',
        title: e.description,
        amount: e.amount,
      });
    }

    for (const t of timeEntries) {
      const hours = Math.floor(t.durationMinutes / 60);
      const mins = t.durationMinutes % 60;
      addEvent(toDateKey(t.date), {
        id: t.id,
        type: 'time_entry',
        title: `${hours}h ${mins}m logged`,
        amount: t.totalCost,
      });
    }

    for (const m of mileageTrips) {
      addEvent(toDateKey(m.date), {
        id: m.id,
        type: 'mileage',
        title: m.purpose ?? `${m.distanceMiles} mi`,
        amount: m.totalDeduction,
      });
    }

    for (const inv of invoices) {
      if (inv.dueDate) {
        addEvent(toDateKey(inv.dueDate), {
          id: inv.id,
          type: 'invoice_due',
          title: `${inv.invoiceNumber} due`,
          amount: inv.total,
        });
      }
    }

    for (const re of recurringExpenses) {
      if (re.nextOccurrence) {
        addEvent(toDateKey(re.nextOccurrence), {
          id: re.id,
          type: 'recurring_expense',
          title: re.description,
          amount: re.amount,
        });
      }
    }

    const summary = {
      expenses: expenses.length,
      timeEntries: timeEntries.length,
      mileageTrips: mileageTrips.length,
      invoicesDue: invoices.length,
      recurringExpenses: recurringExpenses.length,
    };

    return { days, summary };
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
