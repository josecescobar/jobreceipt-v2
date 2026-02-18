import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface SubcontractorQuery {
  search?: string;
  w9Received?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class SubcontractorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, query: SubcontractorQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.SubcontractorWhereInput = { organizationId: orgId };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    if (query.w9Received !== undefined) {
      where.w9Received = query.w9Received;
    }

    const [data, total] = await Promise.all([
      this.prisma.subcontractor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.subcontractor.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const subcontractor = await this.prisma.subcontractor.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!subcontractor) {
      throw new NotFoundException('Subcontractor not found');
    }
    return subcontractor;
  }

  async create(
    orgId: string,
    userId: string,
    data: {
      name: string;
      companyName?: string;
      phone?: string;
      email?: string;
      address?: string;
      trade?: string;
      licenseNumber?: string;
      insuranceExpiry?: string;
      w9Received?: boolean;
      notes?: string;
    },
  ) {
    const createData: Prisma.SubcontractorCreateInput = {
      organization: { connect: { id: orgId } },
      createdBy: { connect: { id: userId } },
      name: data.name,
      companyName: data.companyName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      trade: data.trade,
      licenseNumber: data.licenseNumber,
      w9Received: data.w9Received,
      notes: data.notes,
    };

    if (data.insuranceExpiry) {
      createData.insuranceExpiry = new Date(data.insuranceExpiry);
    }

    return this.prisma.subcontractor.create({ data: createData });
  }

  async update(
    orgId: string,
    id: string,
    data: Partial<{
      name: string;
      companyName?: string;
      phone?: string;
      email?: string;
      address?: string;
      trade?: string;
      licenseNumber?: string;
      insuranceExpiry?: string;
      w9Received?: boolean;
      notes?: string;
    }>,
  ) {
    await this.findOne(orgId, id);

    const updateData: Prisma.SubcontractorUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.trade !== undefined) updateData.trade = data.trade;
    if (data.licenseNumber !== undefined)
      updateData.licenseNumber = data.licenseNumber;
    if (data.insuranceExpiry !== undefined) {
      updateData.insuranceExpiry = data.insuranceExpiry
        ? new Date(data.insuranceExpiry)
        : null;
    }
    if (data.w9Received !== undefined) updateData.w9Received = data.w9Received;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.subcontractor.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.subcontractor.delete({ where: { id } });
  }

  async getSummary(orgId: string, subId: string) {
    await this.findOne(orgId, subId);

    const [aggregate, count] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { subcontractorId: subId, organizationId: orgId },
        _sum: { amount: true },
      }),
      this.prisma.expense.count({
        where: { subcontractorId: subId, organizationId: orgId },
      }),
    ]);

    return {
      totalPaid: aggregate._sum.amount || 0,
      expenseCount: count,
    };
  }
}
