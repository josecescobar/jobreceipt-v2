import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { QueryWarrantyDto } from './dto/query-warranty.dto';
import { CreateWarrantyClaimDto } from './dto/create-warranty-claim.dto';
import { WarrantyStatus } from '@prisma/client';

const warrantyInclude = {
  job: { select: { id: true, name: true } },
  claims: { orderBy: { createdAt: 'desc' as const } },
  createdBy: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class WarrantiesService {
  constructor(private prisma: PrismaService) {}

  private computeStatus(startDate: Date, endDate: Date): WarrantyStatus {
    const now = new Date();
    if (endDate < now) {
      return WarrantyStatus.EXPIRED;
    }
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    if (endDate < thirtyDaysFromNow) {
      return WarrantyStatus.EXPIRING_SOON;
    }
    return WarrantyStatus.ACTIVE;
  }

  async create(orgId: string, userId: string, data: CreateWarrantyDto) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const status = this.computeStatus(startDate, endDate);

    return this.prisma.warranty.create({
      data: {
        organization: { connect: { id: orgId } },
        job: { connect: { id: data.jobId } },
        createdBy: { connect: { id: userId } },
        title: data.title,
        description: data.description,
        manufacturer: data.manufacturer,
        warrantyProvider: data.warrantyProvider,
        startDate,
        endDate,
        status,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        ...(data.documentId
          ? { document: { connect: { id: data.documentId } } }
          : {}),
        notes: data.notes,
      },
      include: warrantyInclude,
    });
  }

  async findAll(orgId: string, query: QueryWarrantyDto) {
    const where: any = {
      organizationId: orgId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.jobId) {
      where.jobId = query.jobId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { manufacturer: { contains: query.search, mode: 'insensitive' } },
        {
          warrantyProvider: { contains: query.search, mode: 'insensitive' },
        },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.warranty.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { endDate: 'asc' },
        include: warrantyInclude,
      }),
      this.prisma.warranty.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const warranty = await this.prisma.warranty.findFirst({
      where: { id, organizationId: orgId },
      include: warrantyInclude,
    });

    if (!warranty) throw new NotFoundException('Warranty not found');

    return warranty;
  }

  async update(orgId: string, id: string, data: UpdateWarrantyDto) {
    const existing = await this.prisma.warranty.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) throw new NotFoundException('Warranty not found');

    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.manufacturer !== undefined)
      updateData.manufacturer = data.manufacturer;
    if (data.warrantyProvider !== undefined)
      updateData.warrantyProvider = data.warrantyProvider;
    if (data.contactPhone !== undefined)
      updateData.contactPhone = data.contactPhone;
    if (data.contactEmail !== undefined)
      updateData.contactEmail = data.contactEmail;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.jobId !== undefined) updateData.job = { connect: { id: data.jobId } };
    if (data.documentId !== undefined)
      updateData.document = { connect: { id: data.documentId } };

    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);

    // Recalculate status if dates changed, unless status is explicitly provided
    if (data.status !== undefined) {
      updateData.status = data.status;
    } else if (data.startDate !== undefined || data.endDate !== undefined) {
      const startDate = data.startDate
        ? new Date(data.startDate)
        : existing.startDate;
      const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;
      updateData.status = this.computeStatus(startDate, endDate);
    }

    return this.prisma.warranty.update({
      where: { id },
      data: updateData,
      include: warrantyInclude,
    });
  }

  async remove(orgId: string, id: string) {
    const warranty = await this.prisma.warranty.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!warranty) throw new NotFoundException('Warranty not found');

    return this.prisma.warranty.delete({ where: { id } });
  }

  async getSummary(orgId: string) {
    const [active, expiringSoon, expired, claimed] = await Promise.all([
      this.prisma.warranty.count({
        where: { organizationId: orgId, status: WarrantyStatus.ACTIVE },
      }),
      this.prisma.warranty.count({
        where: { organizationId: orgId, status: WarrantyStatus.EXPIRING_SOON },
      }),
      this.prisma.warranty.count({
        where: { organizationId: orgId, status: WarrantyStatus.EXPIRED },
      }),
      this.prisma.warranty.count({
        where: { organizationId: orgId, status: WarrantyStatus.CLAIMED },
      }),
    ]);

    const total = active + expiringSoon + expired + claimed;

    return { active, expiringSoon, expired, claimed, total };
  }

  async getUpcomingExpirations(orgId: string) {
    const now = new Date();
    const ninetyDaysFromNow = new Date(
      now.getTime() + 90 * 24 * 60 * 60 * 1000,
    );

    return this.prisma.warranty.findMany({
      where: {
        organizationId: orgId,
        endDate: {
          gte: now,
          lte: ninetyDaysFromNow,
        },
        status: {
          in: [WarrantyStatus.ACTIVE, WarrantyStatus.EXPIRING_SOON],
        },
      },
      include: warrantyInclude,
      orderBy: { endDate: 'asc' },
    });
  }

  async addClaim(
    orgId: string,
    userId: string,
    warrantyId: string,
    data: CreateWarrantyClaimDto,
  ) {
    const warranty = await this.prisma.warranty.findFirst({
      where: { id: warrantyId, organizationId: orgId },
    });

    if (!warranty) throw new NotFoundException('Warranty not found');

    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.warrantyClaim.create({
        data: {
          warranty: { connect: { id: warrantyId } },
          createdBy: { connect: { id: userId } },
          claimDate: new Date(data.claimDate),
          description: data.description,
        },
      });

      await tx.warranty.update({
        where: { id: warrantyId },
        data: { status: WarrantyStatus.CLAIMED },
      });

      return claim;
    });
  }
}
