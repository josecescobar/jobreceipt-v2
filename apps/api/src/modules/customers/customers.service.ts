import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CustomerQuery {
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, query: CustomerQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.CustomerWhereInput = { organizationId: orgId };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId: orgId },
      include: {
        _count: { select: { jobs: true } },
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Compute lifetime spending from invoices on this customer's jobs
    const spending = await this.prisma.invoice.aggregate({
      where: {
        job: { customerId: id },
        organizationId: orgId,
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
      },
      _sum: { paidAmount: true },
    });

    const { _count, ...rest } = customer;
    return {
      ...rest,
      jobCount: _count.jobs,
      lifetimeSpending: spending._sum.paidAmount || 0,
    };
  }

  async create(
    orgId: string,
    userId: string,
    data: {
      name: string;
      companyName?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      notes?: string;
    },
  ) {
    return this.prisma.customer.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        ...data,
      },
    });
  }

  async update(
    orgId: string,
    id: string,
    data: Partial<{
      name: string;
      companyName?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      notes?: string;
    }>,
  ) {
    await this.findOne(orgId, id);

    const updateData: Prisma.CustomerUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zip !== undefined) updateData.zip = data.zip;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.customer.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.customer.delete({ where: { id } });
  }

  async getJobs(orgId: string, customerId: string, page = 1, limit = 20) {
    await this.findOne(orgId, customerId);

    const where: Prisma.JobWhereInput = {
      organizationId: orgId,
      customerId,
    };

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
