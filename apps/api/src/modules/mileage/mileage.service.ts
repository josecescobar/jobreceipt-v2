import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IRS_MILEAGE_RATE_CENTS } from '@jobreceipt/shared';
import { CreateMileageDto } from './dto/create-mileage.dto';
import { UpdateMileageDto } from './dto/update-mileage.dto';

interface MileageQuery {
  jobId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

@Injectable()
export class MileageService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, data: CreateMileageDto) {
    const rate = data.irsRate ?? IRS_MILEAGE_RATE_CENTS;
    const totalDeduction = Math.round(data.distanceMiles * rate);

    return this.prisma.mileageTrip.create({
      data: {
        organizationId: orgId,
        userId,
        jobId: data.jobId,
        startLat: data.startLat,
        startLng: data.startLng,
        endLat: data.endLat,
        endLng: data.endLng,
        distanceMiles: data.distanceMiles,
        irsRate: rate,
        totalDeduction,
        date: new Date(data.date),
        purpose: data.purpose,
      },
      include: {
        job: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(orgId: string, query: MileageQuery) {
    const where: any = { organizationId: orgId };

    if (query.jobId) where.jobId = query.jobId;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.mileageTrip.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { date: 'desc' },
        include: {
          job: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.mileageTrip.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const trip = await this.prisma.mileageTrip.findFirst({
      where: { id, organizationId: orgId },
      include: {
        job: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!trip) throw new NotFoundException('Mileage trip not found');
    return trip;
  }

  async update(orgId: string, id: string, data: UpdateMileageDto) {
    const existing = await this.findOne(orgId, id);

    const updateData: any = {};
    if (data.jobId !== undefined) updateData.jobId = data.jobId;
    if (data.startLat !== undefined) updateData.startLat = data.startLat;
    if (data.startLng !== undefined) updateData.startLng = data.startLng;
    if (data.endLat !== undefined) updateData.endLat = data.endLat;
    if (data.endLng !== undefined) updateData.endLng = data.endLng;
    if (data.distanceMiles !== undefined) updateData.distanceMiles = data.distanceMiles;
    if (data.irsRate !== undefined) updateData.irsRate = data.irsRate;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.purpose !== undefined) updateData.purpose = data.purpose;

    // Recalculate totalDeduction if distance or rate changed
    const newDistance = data.distanceMiles ?? existing.distanceMiles;
    const newRate = data.irsRate ?? existing.irsRate;
    if (data.distanceMiles !== undefined || data.irsRate !== undefined) {
      updateData.totalDeduction = Math.round(newDistance * newRate);
    }

    return this.prisma.mileageTrip.update({
      where: { id },
      data: updateData,
      include: {
        job: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.mileageTrip.delete({ where: { id } });
  }

  async getSummary(orgId: string, query: { jobId?: string; startDate?: string; endDate?: string }) {
    const where: any = { organizationId: orgId };

    if (query.jobId) where.jobId = query.jobId;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const [agg, totalTrips] = await Promise.all([
      this.prisma.mileageTrip.aggregate({
        where,
        _sum: {
          distanceMiles: true,
          totalDeduction: true,
        },
      }),
      this.prisma.mileageTrip.count({ where }),
    ]);

    return {
      totalTrips,
      totalMiles: agg._sum.distanceMiles ?? 0,
      totalDeduction: agg._sum.totalDeduction ?? 0,
    };
  }
}
