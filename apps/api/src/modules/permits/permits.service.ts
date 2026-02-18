import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermitDto } from './dto/create-permit.dto';
import { UpdatePermitDto } from './dto/update-permit.dto';
import { QueryPermitDto } from './dto/query-permit.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { PermitStatus, InspectionResult } from '@prisma/client';

const permitInclude = {
  job: { select: { id: true, name: true } },
  inspections: { orderBy: { scheduledDate: 'asc' as const } },
  createdBy: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class PermitsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, data: CreatePermitDto) {
    return this.prisma.permit.create({
      data: {
        organization: { connect: { id: orgId } },
        job: { connect: { id: data.jobId } },
        createdBy: { connect: { id: userId } },
        permitNumber: data.permitNumber,
        type: data.type,
        status: PermitStatus.APPLIED,
        ...(data.appliedDate
          ? { appliedDate: new Date(data.appliedDate) }
          : {}),
        ...(data.issuedDate
          ? { issuedDate: new Date(data.issuedDate) }
          : {}),
        ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : {}),
        authority: data.authority,
        fee: data.fee,
        ...(data.documentId
          ? { document: { connect: { id: data.documentId } } }
          : {}),
        notes: data.notes,
      },
      include: permitInclude,
    });
  }

  async findAll(orgId: string, query: QueryPermitDto) {
    const where: any = {
      organizationId: orgId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.jobId) {
      where.jobId = query.jobId;
    }

    if (query.search) {
      where.OR = [
        { permitNumber: { contains: query.search, mode: 'insensitive' } },
        { authority: { contains: query.search, mode: 'insensitive' } },
        {
          job: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.permit.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: permitInclude,
      }),
      this.prisma.permit.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const permit = await this.prisma.permit.findFirst({
      where: { id, organizationId: orgId },
      include: permitInclude,
    });

    if (!permit) throw new NotFoundException('Permit not found');

    return permit;
  }

  async update(orgId: string, id: string, data: UpdatePermitDto) {
    const existing = await this.prisma.permit.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) throw new NotFoundException('Permit not found');

    const updateData: any = {};

    if (data.jobId !== undefined) updateData.job = { connect: { id: data.jobId } };
    if (data.permitNumber !== undefined) updateData.permitNumber = data.permitNumber;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.appliedDate !== undefined)
      updateData.appliedDate = new Date(data.appliedDate);
    if (data.issuedDate !== undefined)
      updateData.issuedDate = new Date(data.issuedDate);
    if (data.expiresAt !== undefined)
      updateData.expiresAt = new Date(data.expiresAt);
    if (data.authority !== undefined) updateData.authority = data.authority;
    if (data.fee !== undefined) updateData.fee = data.fee;
    if (data.documentId !== undefined)
      updateData.document = { connect: { id: data.documentId } };
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.permit.update({
      where: { id },
      data: updateData,
      include: permitInclude,
    });
  }

  async remove(orgId: string, id: string) {
    const permit = await this.prisma.permit.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!permit) throw new NotFoundException('Permit not found');

    return this.prisma.permit.delete({ where: { id } });
  }

  async getSummary(orgId: string) {
    const [applied, issued, expired] = await Promise.all([
      this.prisma.permit.count({
        where: { organizationId: orgId, status: PermitStatus.APPLIED },
      }),
      this.prisma.permit.count({
        where: { organizationId: orgId, status: PermitStatus.ISSUED },
      }),
      this.prisma.permit.count({
        where: { organizationId: orgId, status: PermitStatus.EXPIRED },
      }),
    ]);

    const total = applied + issued + expired;

    return { applied, issued, expired, total };
  }

  async getUpcomingInspections(orgId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    return this.prisma.permitInspection.findMany({
      where: {
        permit: { organizationId: orgId },
        scheduledDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        result: InspectionResult.PENDING,
      },
      include: {
        permit: {
          select: {
            id: true,
            permitNumber: true,
            type: true,
            job: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async getExpiringPermits(orgId: string) {
    const now = new Date();
    const ninetyDaysFromNow = new Date(
      now.getTime() + 90 * 24 * 60 * 60 * 1000,
    );

    return this.prisma.permit.findMany({
      where: {
        organizationId: orgId,
        status: PermitStatus.ISSUED,
        expiresAt: {
          gte: now,
          lte: ninetyDaysFromNow,
        },
      },
      include: permitInclude,
      orderBy: { expiresAt: 'asc' },
    });
  }

  async addInspection(
    orgId: string,
    userId: string,
    permitId: string,
    data: CreateInspectionDto,
  ) {
    const permit = await this.prisma.permit.findFirst({
      where: { id: permitId, organizationId: orgId },
    });

    if (!permit) throw new NotFoundException('Permit not found');

    return this.prisma.permitInspection.create({
      data: {
        permit: { connect: { id: permitId } },
        createdBy: { connect: { id: userId } },
        scheduledDate: new Date(data.scheduledDate),
        inspector: data.inspector,
        notes: data.notes,
      },
    });
  }

  async updateInspection(
    orgId: string,
    inspectionId: string,
    data: UpdateInspectionDto,
  ) {
    const inspection = await this.prisma.permitInspection.findFirst({
      where: {
        id: inspectionId,
        permit: { organizationId: orgId },
      },
    });

    if (!inspection) throw new NotFoundException('Inspection not found');

    const updateData: any = {};

    if (data.completedDate !== undefined)
      updateData.completedDate = new Date(data.completedDate);
    if (data.result !== undefined) updateData.result = data.result;
    if (data.inspector !== undefined) updateData.inspector = data.inspector;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.permitInspection.update({
      where: { id: inspectionId },
      data: updateData,
    });
  }
}
