import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  private computeTotalCost(durationMinutes: number, hourlyRate: number): number {
    return Math.round((durationMinutes / 60) * hourlyRate);
  }

  async create(orgId: string, userId: string, data: CreateTimeEntryDto) {
    const totalCost = this.computeTotalCost(data.durationMinutes, data.hourlyRate);

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
    if (data.description !== undefined) updateData.description = data.description;

    // Recalculate totalCost if duration or rate changed
    if (data.durationMinutes !== undefined || data.hourlyRate !== undefined) {
      const newDuration = data.durationMinutes ?? existing.durationMinutes;
      const newRate = data.hourlyRate ?? existing.hourlyRate;
      updateData.totalCost = this.computeTotalCost(newDuration, newRate);
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
        },
      }),
      this.prisma.timeEntry.count({ where }),
    ]);

    return {
      totalEntries,
      totalMinutes: agg._sum.durationMinutes ?? 0,
      totalCost: agg._sum.totalCost ?? 0,
    };
  }
}
