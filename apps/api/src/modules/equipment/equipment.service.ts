import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { QueryEquipmentDto } from './dto/query-equipment.dto';
import { CheckOutEquipmentDto } from './dto/check-out-equipment.dto';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { EquipmentStatus, MaintenanceType } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, data: CreateEquipmentDto) {
    return this.prisma.equipment.create({
      data: {
        organization: { connect: { id: orgId } },
        createdBy: { connect: { id: userId } },
        name: data.name,
        type: data.type,
        make: data.make,
        model: data.model,
        serialNumber: data.serialNumber,
        ...(data.purchaseDate
          ? { purchaseDate: new Date(data.purchaseDate) }
          : {}),
        purchaseCost: data.purchaseCost,
        notes: data.notes,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(orgId: string, query: QueryEquipmentDto) {
    const where: any = {
      organizationId: orgId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { type: { contains: query.search, mode: 'insensitive' } },
        { make: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          createdBy: { select: { id: true, name: true } },
          assignments: {
            where: { checkedInAt: null },
            take: 1,
            orderBy: { checkedOutAt: 'desc' },
            include: {
              job: { select: { id: true, name: true } },
              checkedOutBy: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.equipment.count({ where }),
    ]);

    // Map assignments into a currentAssignment field
    const mapped = data.map((eq) => {
      const { assignments, ...rest } = eq;
      return {
        ...rest,
        currentAssignment: assignments[0] ?? null,
      };
    });

    return { data: mapped, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id, organizationId: orgId },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignments: {
          orderBy: { checkedOutAt: 'desc' },
          include: {
            job: { select: { id: true, name: true } },
            checkedOutBy: { select: { id: true, name: true } },
            checkedInBy: { select: { id: true, name: true } },
          },
        },
        maintenanceLogs: {
          orderBy: { performedAt: 'desc' },
          include: {
            performedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!equipment) throw new NotFoundException('Equipment not found');

    return equipment;
  }

  async update(orgId: string, id: string, data: UpdateEquipmentDto) {
    const existing = await this.prisma.equipment.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) throw new NotFoundException('Equipment not found');

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.make !== undefined) updateData.make = data.make;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.serialNumber !== undefined)
      updateData.serialNumber = data.serialNumber;
    if (data.purchaseDate !== undefined)
      updateData.purchaseDate = new Date(data.purchaseDate);
    if (data.purchaseCost !== undefined)
      updateData.purchaseCost = data.purchaseCost;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;

    return this.prisma.equipment.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async remove(orgId: string, id: string) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!equipment) throw new NotFoundException('Equipment not found');

    return this.prisma.equipment.delete({ where: { id } });
  }

  async checkOut(orgId: string, userId: string, data: CheckOutEquipmentDto) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id: data.equipmentId, organizationId: orgId },
    });

    if (!equipment) throw new NotFoundException('Equipment not found');

    if (equipment.status !== EquipmentStatus.AVAILABLE) {
      throw new ConflictException(
        'Equipment is not available for check-out',
      );
    }

    // Check for active assignment
    const activeAssignment = await this.prisma.equipmentAssignment.findFirst({
      where: {
        equipmentId: data.equipmentId,
        checkedInAt: null,
      },
    });

    if (activeAssignment) {
      throw new ConflictException(
        'Equipment already has an active assignment',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.equipmentAssignment.create({
        data: {
          organization: { connect: { id: orgId } },
          equipment: { connect: { id: data.equipmentId } },
          job: { connect: { id: data.jobId } },
          checkedOutBy: { connect: { id: userId } },
          checkedOutAt: new Date(),
          notes: data.notes,
        },
        include: {
          equipment: { select: { id: true, name: true } },
          job: { select: { id: true, name: true } },
          checkedOutBy: { select: { id: true, name: true } },
        },
      });

      await tx.equipment.update({
        where: { id: data.equipmentId },
        data: { status: EquipmentStatus.IN_USE },
      });

      return assignment;
    });
  }

  async checkIn(
    orgId: string,
    assignmentId: string,
    userId: string,
    notes?: string,
  ) {
    const assignment = await this.prisma.equipmentAssignment.findFirst({
      where: {
        id: assignmentId,
        organizationId: orgId,
        checkedInAt: null,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Active assignment not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.equipmentAssignment.update({
        where: { id: assignmentId },
        data: {
          checkedInAt: new Date(),
          checkedInBy: { connect: { id: userId } },
          ...(notes !== undefined ? { notes } : {}),
        },
        include: {
          equipment: { select: { id: true, name: true } },
          job: { select: { id: true, name: true } },
          checkedOutBy: { select: { id: true, name: true } },
          checkedInBy: { select: { id: true, name: true } },
        },
      });

      await tx.equipment.update({
        where: { id: assignment.equipmentId },
        data: { status: EquipmentStatus.AVAILABLE },
      });

      return updated;
    });
  }

  async createMaintenanceLog(
    orgId: string,
    userId: string,
    data: CreateMaintenanceLogDto,
  ) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id: data.equipmentId, organizationId: orgId },
    });

    if (!equipment) throw new NotFoundException('Equipment not found');

    // Check for active assignment and check in if exists
    const activeAssignment = await this.prisma.equipmentAssignment.findFirst({
      where: {
        equipmentId: data.equipmentId,
        checkedInAt: null,
      },
    });

    return this.prisma.$transaction(async (tx) => {
      // Check in if active assignment
      if (activeAssignment) {
        await tx.equipmentAssignment.update({
          where: { id: activeAssignment.id },
          data: {
            checkedInAt: new Date(),
            checkedInBy: { connect: { id: userId } },
          },
        });
      }

      // Set status to MAINTENANCE
      await tx.equipment.update({
        where: { id: data.equipmentId },
        data: { status: EquipmentStatus.MAINTENANCE },
      });

      // Create maintenance log
      return tx.maintenanceLog.create({
        data: {
          equipment: { connect: { id: data.equipmentId } },
          type: data.type as MaintenanceType,
          description: data.description,
          performedAt: new Date(data.performedAt),
          performedBy: { connect: { id: userId } },
          cost: data.cost,
          notes: data.notes,
          ...(data.nextDueDate
            ? { nextDueDate: new Date(data.nextDueDate) }
            : {}),
        },
        include: {
          equipment: { select: { id: true, name: true } },
          performedBy: { select: { id: true, name: true } },
        },
      });
    });
  }

  async getSummary(orgId: string) {
    const [available, inUse, maintenance, retired] = await Promise.all([
      this.prisma.equipment.count({
        where: { organizationId: orgId, status: EquipmentStatus.AVAILABLE },
      }),
      this.prisma.equipment.count({
        where: { organizationId: orgId, status: EquipmentStatus.IN_USE },
      }),
      this.prisma.equipment.count({
        where: { organizationId: orgId, status: EquipmentStatus.MAINTENANCE },
      }),
      this.prisma.equipment.count({
        where: { organizationId: orgId, status: EquipmentStatus.RETIRED },
      }),
    ]);

    const total = available + inUse + maintenance + retired;

    return { total, available, inUse, maintenance, retired };
  }

  async getJobEquipment(orgId: string, jobId: string) {
    const assignments = await this.prisma.equipmentAssignment.findMany({
      where: {
        organizationId: orgId,
        jobId,
        checkedInAt: null,
      },
      include: {
        equipment: {
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        },
        checkedOutBy: { select: { id: true, name: true } },
      },
      orderBy: { checkedOutAt: 'desc' },
    });

    return assignments;
  }

  async getUpcomingMaintenance(orgId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    return this.prisma.maintenanceLog.findMany({
      where: {
        equipment: { organizationId: orgId },
        nextDueDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        equipment: { select: { id: true, name: true } },
        performedBy: { select: { id: true, name: true } },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }
}
