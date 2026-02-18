import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_COST_CODES } from '@jobreceipt/shared';

@Injectable()
export class CostCodesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.costCode.findMany({
      where: { organizationId: orgId },
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(orgId: string, id: string) {
    const costCode = await this.prisma.costCode.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!costCode) {
      throw new NotFoundException('Cost code not found');
    }
    return costCode;
  }

  async create(
    orgId: string,
    data: {
      code: string;
      name: string;
      category:
        | 'MATERIALS'
        | 'LABOR'
        | 'EQUIPMENT'
        | 'SUBCONTRACTOR'
        | 'OVERHEAD';
    },
  ) {
    const existing = await this.prisma.costCode.findUnique({
      where: {
        organizationId_code: { organizationId: orgId, code: data.code },
      },
    });
    if (existing) {
      throw new ConflictException(`Cost code ${data.code} already exists`);
    }

    return this.prisma.costCode.create({
      data: {
        organizationId: orgId,
        code: data.code,
        name: data.name,
        category: data.category,
      },
    });
  }

  async update(
    orgId: string,
    id: string,
    data: Partial<{
      code: string;
      name: string;
      category:
        | 'MATERIALS'
        | 'LABOR'
        | 'EQUIPMENT'
        | 'SUBCONTRACTOR'
        | 'OVERHEAD';
    }>,
  ) {
    await this.findOne(orgId, id);

    // Check code uniqueness if changing code
    if (data.code) {
      const existing = await this.prisma.costCode.findUnique({
        where: {
          organizationId_code: { organizationId: orgId, code: data.code },
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Cost code ${data.code} already exists`);
      }
    }

    return this.prisma.costCode.update({
      where: { id },
      data,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    try {
      return await this.prisma.costCode.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Cost code is in use by expenses or other records',
        );
      }
      throw error;
    }
  }

  async seedDefaults(orgId: string) {
    const existingCodes = await this.prisma.costCode.findMany({
      where: { organizationId: orgId },
      select: { code: true },
    });

    const existingSet = new Set(existingCodes.map((c) => c.code));
    const toCreate = DEFAULT_COST_CODES.filter(
      (dc) => !existingSet.has(dc.code),
    );

    if (toCreate.length > 0) {
      await this.prisma.costCode.createMany({
        data: toCreate.map((dc) => ({
          organizationId: orgId,
          code: dc.code,
          name: dc.name,
          category: dc.category,
        })),
      });
    }

    return {
      created: toCreate.length,
      skipped: DEFAULT_COST_CODES.length - toCreate.length,
    };
  }
}
