import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCrewAssignmentDto } from './dto/create-crew-assignment.dto';
import { UpdateCrewAssignmentDto } from './dto/update-crew-assignment.dto';
import { QueryCrewAssignmentDto } from './dto/query-crew-assignment.dto';

const assignmentInclude = {
  job: { select: { id: true, name: true } },
  user: { select: { id: true, name: true } },
};

@Injectable()
export class CrewSchedulingService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, createdById: string, data: CreateCrewAssignmentDto) {
    let created = 0;
    let skipped = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const dateStr of data.dates) {
        try {
          await tx.crewAssignment.create({
            data: {
              organizationId: orgId,
              jobId: data.jobId,
              userId: data.userId,
              date: new Date(dateStr),
              startTime: data.startTime ?? null,
              endTime: data.endTime ?? null,
              notes: data.notes ?? null,
              createdById,
            },
          });
          created++;
        } catch (err: any) {
          // P2002 = unique constraint violation (jobId + userId + date)
          if (err.code === 'P2002') {
            skipped++;
          } else {
            throw err;
          }
        }
      }
    });

    return { created, skipped };
  }

  async findAll(orgId: string, query: QueryCrewAssignmentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = { organizationId: orgId };

    if (query.jobId) where.jobId = query.jobId;
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    if (query.date) {
      const d = new Date(query.date);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      where.date = { gte: startOfDay, lt: endOfDay };
    } else if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.crewAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'asc' },
        include: assignmentInclude,
      }),
      this.prisma.crewAssignment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getMySchedule(
    orgId: string,
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { organizationId: orgId, userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return this.prisma.crewAssignment.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        job: { select: { id: true, name: true } },
      },
    });
  }

  async getToday(orgId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const assignments = await this.prisma.crewAssignment.findMany({
      where: {
        organizationId: orgId,
        date: { gte: startOfToday, lt: startOfTomorrow },
      },
      orderBy: { date: 'asc' },
      include: {
        job: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });

    // Group by job
    const jobMap = new Map<string, { job: { id: string; name: string }; assignments: typeof assignments }>();

    for (const a of assignments) {
      if (!a.job) continue;
      const existing = jobMap.get(a.jobId);
      if (existing) {
        existing.assignments.push(a);
      } else {
        jobMap.set(a.jobId, { job: a.job, assignments: [a] });
      }
    }

    return Array.from(jobMap.values());
  }

  async findOne(orgId: string, id: string) {
    const assignment = await this.prisma.crewAssignment.findFirst({
      where: { id, organizationId: orgId },
      include: {
        ...assignmentInclude,
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!assignment) throw new NotFoundException('Crew assignment not found');
    return assignment;
  }

  async update(orgId: string, id: string, data: UpdateCrewAssignmentDto) {
    await this.findOne(orgId, id);

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.crewAssignment.update({
      where: { id },
      data: updateData,
      include: assignmentInclude,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.crewAssignment.delete({ where: { id } });
  }
}
