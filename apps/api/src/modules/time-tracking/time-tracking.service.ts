import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

interface TimeEntryQuery {
  jobId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

const timeEntryInclude = {
  job: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true } },
};

const WEEKLY_REGULAR_LIMIT = 2400; // 40 hours in minutes

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get Monday 00:00:00 of the week containing the given date.
   */
  private getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
    const diff = day === 0 ? -6 : 1 - day; // if Sunday go back 6, otherwise go back to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Compute overtime for a given entry based on weekly totals.
   */
  private async computeOvertime(
    orgId: string,
    userId: string,
    entryDate: Date,
    entryDuration: number,
    excludeEntryId?: string,
  ): Promise<{ overtimeMinutes: number; regularMinutes: number }> {
    const monday = this.getMondayOfWeek(entryDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const where: any = {
      organizationId: orgId,
      userId,
      date: { gte: monday, lte: sunday },
    };
    if (excludeEntryId) {
      where.id = { not: excludeEntryId };
    }

    const agg = await this.prisma.timeEntry.aggregate({
      where,
      _sum: { durationMinutes: true },
    });

    const otherEntriesTotal = agg._sum.durationMinutes ?? 0;
    const weeklyTotal = otherEntriesTotal + entryDuration;

    if (weeklyTotal <= WEEKLY_REGULAR_LIMIT) {
      return { overtimeMinutes: 0, regularMinutes: entryDuration };
    }

    const overtimeMinutes = Math.max(0, entryDuration - (WEEKLY_REGULAR_LIMIT - otherEntriesTotal));
    return { overtimeMinutes, regularMinutes: entryDuration - overtimeMinutes };
  }

  /**
   * Compute total cost with overtime breakdown.
   */
  private computeTotalCostWithOvertime(
    regularMinutes: number,
    overtimeMinutes: number,
    hourlyRate: number,
    overtimeRate?: number | null,
  ): number {
    const regularCost = (regularMinutes / 60) * hourlyRate;
    const effectiveOvertimeRate = overtimeRate ?? Math.round(hourlyRate * 1.5);
    const overtimeCost = (overtimeMinutes / 60) * effectiveOvertimeRate;
    return Math.round(regularCost + overtimeCost);
  }

  async create(orgId: string, userId: string, data: CreateTimeEntryDto) {
    const { overtimeMinutes, regularMinutes } = await this.computeOvertime(
      orgId,
      userId,
      new Date(data.date),
      data.durationMinutes,
    );

    const totalCost = this.computeTotalCostWithOvertime(
      regularMinutes,
      overtimeMinutes,
      data.hourlyRate,
      data.overtimeRate,
    );

    return this.prisma.timeEntry.create({
      data: {
        organizationId: orgId,
        userId,
        jobId: data.jobId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        hourlyRate: data.hourlyRate,
        overtimeMinutes,
        overtimeRate: data.overtimeRate,
        totalCost,
        description: data.description,
      },
      include: timeEntryInclude,
    });
  }

  async findAll(orgId: string, query: TimeEntryQuery) {
    const where: any = { organizationId: orgId };

    if (query.jobId) where.jobId = query.jobId;
    if (query.userId) where.userId = query.userId;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.timeEntry.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { date: 'desc' },
        include: timeEntryInclude,
      }),
      this.prisma.timeEntry.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id, organizationId: orgId },
      include: timeEntryInclude,
    });
    if (!entry) throw new NotFoundException('Time entry not found');
    return entry;
  }

  async update(orgId: string, id: string, data: UpdateTimeEntryDto) {
    const existing = await this.findOne(orgId, id);

    const updateData: any = {};
    if (data.jobId !== undefined) updateData.jobId = data.jobId;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.overtimeRate !== undefined) updateData.overtimeRate = data.overtimeRate;
    if (data.description !== undefined) updateData.description = data.description;

    // Recalculate overtime + totalCost if duration, rate, or date changed
    if (data.durationMinutes !== undefined || data.hourlyRate !== undefined || data.date !== undefined) {
      const newDuration = data.durationMinutes ?? existing.durationMinutes;
      const newRate = data.hourlyRate ?? existing.hourlyRate;
      const newDate = data.date ? new Date(data.date) : existing.date;
      const newOvertimeRate = data.overtimeRate !== undefined ? data.overtimeRate : existing.overtimeRate;

      const { overtimeMinutes, regularMinutes } = await this.computeOvertime(
        orgId,
        existing.userId,
        newDate,
        newDuration,
        id,
      );

      updateData.overtimeMinutes = overtimeMinutes;
      updateData.totalCost = this.computeTotalCostWithOvertime(
        regularMinutes,
        overtimeMinutes,
        newRate,
        newOvertimeRate,
      );
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: timeEntryInclude,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.timeEntry.delete({ where: { id } });
  }

  async clockIn(orgId: string, userId: string, jobId: string, hourlyRate?: number) {
    // Check no other entry is running for this user in this org
    const running = await this.prisma.timeEntry.findFirst({
      where: { organizationId: orgId, userId, isRunning: true },
    });
    if (running) {
      throw new BadRequestException('You already have an active timer running. Clock out first.');
    }

    // If no hourlyRate provided, try to get from last entry
    let rate = hourlyRate;
    if (!rate) {
      const lastEntry = await this.prisma.timeEntry.findFirst({
        where: { organizationId: orgId, userId },
        orderBy: { createdAt: 'desc' },
        select: { hourlyRate: true },
      });
      rate = lastEntry?.hourlyRate ?? 0;
    }

    return this.prisma.timeEntry.create({
      data: {
        organizationId: orgId,
        userId,
        jobId,
        isRunning: true,
        clockInAt: new Date(),
        date: new Date(),
        durationMinutes: 0,
        totalCost: 0,
        hourlyRate: rate,
      },
      include: timeEntryInclude,
    });
  }

  async clockOut(orgId: string, entryId: string) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id: entryId, organizationId: orgId },
    });

    if (!entry) throw new NotFoundException('Time entry not found');
    if (!entry.isRunning) throw new BadRequestException('This timer is not running');
    if (!entry.clockInAt) throw new BadRequestException('Timer has no clock-in time');

    const now = new Date();
    const elapsedMinutes = Math.round((now.getTime() - entry.clockInAt.getTime()) / 60000);

    // Compute start/end time strings
    const pad = (n: number) => n.toString().padStart(2, '0');
    const startTime = `${pad(entry.clockInAt.getHours())}:${pad(entry.clockInAt.getMinutes())}`;
    const endTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Compute overtime
    const { overtimeMinutes, regularMinutes } = await this.computeOvertime(
      orgId,
      entry.userId,
      entry.date,
      elapsedMinutes,
      entryId,
    );

    const totalCost = this.computeTotalCostWithOvertime(
      regularMinutes,
      overtimeMinutes,
      entry.hourlyRate,
      entry.overtimeRate,
    );

    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        isRunning: false,
        durationMinutes: elapsedMinutes,
        startTime,
        endTime,
        overtimeMinutes,
        totalCost,
      },
      include: timeEntryInclude,
    });
  }

  async getActiveTimer(orgId: string, userId: string) {
    return this.prisma.timeEntry.findFirst({
      where: { organizationId: orgId, userId, isRunning: true },
      include: timeEntryInclude,
    });
  }

  async getSummary(orgId: string, query: { jobId?: string; userId?: string; startDate?: string; endDate?: string }) {
    const where: any = { organizationId: orgId };

    if (query.jobId) where.jobId = query.jobId;
    if (query.userId) where.userId = query.userId;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const [agg, totalEntries] = await Promise.all([
      this.prisma.timeEntry.aggregate({
        where,
        _sum: {
          durationMinutes: true,
          totalCost: true,
          overtimeMinutes: true,
        },
      }),
      this.prisma.timeEntry.count({ where }),
    ]);

    const totalMinutes = agg._sum.durationMinutes ?? 0;
    const totalCost = agg._sum.totalCost ?? 0;
    const overtimeMinutes = agg._sum.overtimeMinutes ?? 0;
    const regularMinutes = totalMinutes - overtimeMinutes;

    return {
      totalEntries,
      totalMinutes,
      totalCost,
      overtimeMinutes,
      regularMinutes,
    };
  }
}
