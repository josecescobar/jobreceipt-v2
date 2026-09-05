import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { RequestContextService } from '../common/request-context/request-context.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  private async ensureUser(auth: RequestUser): Promise<{ id: string }> {
    const user = await this.prisma.user.upsert({
      where: { clerkId: auth.clerkId },
      create: {
        clerkId: auth.clerkId,
        email: `${auth.clerkId}@jobreceipt.local`,
        role: UserRole.OWNER,
      },
      update: {},
      select: { id: true },
    });

    return user;
  }

  async createOrganization(auth: RequestUser, dto: CreateOrganizationDto) {
    const owner = await this.ensureUser(auth);

    return this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        ownerId: owner.id,
        members: {
          create: {
            userId: owner.id,
            role: UserRole.OWNER,
            acceptedAt: new Date(),
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  async inviteMember(organizationId: string, auth: RequestUser, dto: InviteMemberDto) {
    const contextOrg = this.requestContext.getOrganizationId();

    if (!contextOrg || contextOrg !== organizationId) {
      throw new ForbiddenException('x-org-id must match target organization');
    }

    const owner = await this.ensureUser(auth);

    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        ownerId: owner.id,
      },
      select: {
        id: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found for current owner');
    }

    const invitedUser =
      (await this.prisma.user.findFirst({
        where: {
          email: dto.email,
        },
      })) ??
      (await this.prisma.user.create({
        data: {
          clerkId: `invited_${randomUUID()}`,
          email: dto.email,
          role: dto.role,
        },
      }));

    await this.prisma.organizationMember.createMany({
      data: [
        {
          organizationId,
          userId: invitedUser.id,
          role: dto.role,
        },
      ],
      skipDuplicates: true,
    });

    return this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: invitedUser.id,
      },
    });
  }

  async getCurrent() {
    const organizationId = this.requestContext.getOrganizationId();
    if (!organizationId) {
      throw new NotFoundException('No organization context');
    }

    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      memberCount: org._count.members,
      createdAt: org.createdAt,
    };
  }

  async updateOrganization(organizationId: string, auth: RequestUser, dto: UpdateOrganizationDto) {
    const owner = await this.ensureUser(auth);

    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId, ownerId: owner.id },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found or you are not the owner');
    }

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      },
    });

    return this.getCurrent();
  }
}
