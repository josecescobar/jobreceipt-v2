import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_COST_CODES } from '@jobreceipt/shared';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { name: string; slug: string }) {
    // Check slug uniqueness
    const existing = await this.prisma.organization.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictException('Organization slug already taken');
    }

    // Create org + membership + default cost codes in a transaction
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          ownerId: userId,
        },
      });

      // Auto-assign creator as OWNER member
      await tx.organizationMember.create({
        data: {
          userId,
          organizationId: org.id,
          role: 'OWNER',
          acceptedAt: new Date(),
        },
      });

      // Seed default cost codes
      await tx.costCode.createMany({
        data: DEFAULT_COST_CODES.map((cc) => ({
          organizationId: org.id,
          code: cc.code,
          name: cc.name,
          category: cc.category,
        })),
      });

      return org;
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, jobs: true } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, data: { name?: string; slug?: string }) {
    if (data.slug) {
      const existing = await this.prisma.organization.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (existing) throw new ConflictException('Slug already taken');
    }

    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async inviteMember(orgId: string, email: string, role: 'OWNER' | 'BOOKKEEPER' | 'CREW') {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found. They must sign up first.');
    }

    const existing = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    });
    if (existing) throw new ConflictException('User is already a member');

    return this.prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        role,
      },
    });
  }

  async listMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { invitedAt: 'desc' },
    });
  }
}
