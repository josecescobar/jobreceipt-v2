import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clerkUserId = request.clerkUserId;

    if (!clerkUserId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get orgId from route params, query, or body
    const orgId =
      request.params.organizationId ||
      request.query.organizationId ||
      request.body?.organizationId ||
      request.headers['x-organization-id'];

    if (!orgId) {
      throw new ForbiddenException('Organization ID is required');
    }

    // Find the user by clerkId
    const user = await this.prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check membership
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this organization');
    }

    // Attach user and org info to request
    request.user = user;
    request.organizationId = orgId;
    request.userRole = membership.role;

    return true;
  }
}
