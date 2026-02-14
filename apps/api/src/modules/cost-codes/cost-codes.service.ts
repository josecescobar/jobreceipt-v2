import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CostCodesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.costCode.findMany({
      where: { organizationId: orgId },
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
  }

  async create(orgId: string, data: { code: string; name: string; category: 'MATERIALS' | 'LABOR' | 'EQUIPMENT' | 'SUBCONTRACTOR' | 'OVERHEAD' }) {
    const existing = await this.prisma.costCode.findUnique({
      where: { organizationId_code: { organizationId: orgId, code: data.code } },
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
}
