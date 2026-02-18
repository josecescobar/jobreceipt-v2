import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface VendorQuery {
  search?: string;
  page?: number;
  limit?: number;
}

const vendorInclude = {
  defaultCostCode: { select: { id: true, code: true, name: true } },
};

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, query: VendorQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.VendorWhereInput = { organizationId: orgId };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: vendorInclude,
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, organizationId: orgId },
      include: vendorInclude,
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async create(
    orgId: string,
    userId: string,
    data: {
      name: string;
      contactName?: string;
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
      defaultCategory?: string;
      defaultCostCodeId?: string;
      notes?: string;
    },
  ) {
    return this.prisma.vendor.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        ...data,
      },
      include: vendorInclude,
    });
  }

  async update(
    orgId: string,
    id: string,
    data: Partial<{
      name: string;
      contactName?: string;
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
      defaultCategory?: string;
      defaultCostCodeId?: string | null;
      notes?: string;
    }>,
  ) {
    await this.findOne(orgId, id);

    const updateData: Prisma.VendorUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.contactName !== undefined) updateData.contactName = data.contactName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.defaultCategory !== undefined)
      updateData.defaultCategory = data.defaultCategory;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.defaultCostCodeId !== undefined) {
      updateData.defaultCostCode = data.defaultCostCodeId
        ? { connect: { id: data.defaultCostCodeId } }
        : { disconnect: true };
    }

    return this.prisma.vendor.update({
      where: { id },
      data: updateData,
      include: vendorInclude,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.vendor.delete({ where: { id } });
  }

  async getSpending(orgId: string, vendorId: string) {
    await this.findOne(orgId, vendorId);

    const [aggregate, count] = await Promise.all([
      this.prisma.receipt.aggregate({
        where: { vendorId, organizationId: orgId },
        _sum: { totalAmount: true },
      }),
      this.prisma.receipt.count({
        where: { vendorId, organizationId: orgId },
      }),
    ]);

    return {
      totalSpent: aggregate._sum.totalAmount || 0,
      receiptCount: count,
    };
  }
}
