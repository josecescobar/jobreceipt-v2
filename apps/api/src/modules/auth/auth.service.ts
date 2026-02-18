import { Injectable, Inject, Logger, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';

interface ClerkUserPayload {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name: string | null;
  last_name: string | null;
  phone_numbers: Array<{ phone_number: string }>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => OrganizationsService))
    private organizationsService: OrganizationsService,
  ) {}

  async handleUserCreated(data: ClerkUserPayload) {
    const email = data.email_addresses?.[0]?.email_address;
    const phone = data.phone_numbers?.[0]?.phone_number || null;
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

    this.logger.log(`Creating user from Clerk webhook: ${email}`);

    return this.prisma.user.upsert({
      where: { clerkId: data.id },
      update: { email, name, phone },
      create: {
        clerkId: data.id,
        email,
        name,
        phone,
        role: 'OWNER',
      },
    });
  }

  async handleUserUpdated(data: ClerkUserPayload) {
    const email = data.email_addresses?.[0]?.email_address;
    const phone = data.phone_numbers?.[0]?.phone_number || null;
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

    this.logger.log(`Updating user from Clerk webhook: ${email}`);

    return this.prisma.user.update({
      where: { clerkId: data.id },
      data: { email, name, phone },
    });
  }

  async handleUserDeleted(data: { id: string }) {
    this.logger.log(`Deleting user from Clerk webhook: ${data.id}`);

    return this.prisma.user.delete({
      where: { clerkId: data.id },
    });
  }

  async bootstrapUser(clerkId: string, email: string, name: string | null) {
    this.logger.log(`Bootstrapping user: ${email}`);

    // Upsert user (handles race with Clerk webhook)
    const user = await this.prisma.user.upsert({
      where: { clerkId },
      update: { email, name },
      create: { clerkId, email, name, role: 'OWNER' },
    });

    // Find existing org memberships
    let memberships = await this.prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: { organization: true },
    });

    // Auto-accept any pending invites
    const pendingInvites = memberships.filter((m: any) => !m.acceptedAt);
    if (pendingInvites.length > 0) {
      await this.prisma.organizationMember.updateMany({
        where: {
          id: { in: pendingInvites.map((m: any) => m.id) },
        },
        data: { acceptedAt: new Date() },
      });
      this.logger.log(`Auto-accepted ${pendingInvites.length} pending invite(s) for ${email}`);
    }

    // Auto-create organization if user has none
    if (memberships.length === 0) {
      const slug = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const orgName = name ? `${name}'s Company` : `${slug}'s Company`;

      await this.organizationsService.create(user.id, {
        name: orgName,
        slug: `${slug}-${Date.now()}`,
      });

      memberships = await this.prisma.organizationMember.findMany({
        where: { userId: user.id },
        include: { organization: true },
      });
    }

    return {
      user: { id: user.id, email: user.email, name: user.name },
      organizations: memberships.map((m: any) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
      })),
      defaultOrganizationId: memberships[0]?.organizationId ?? null,
    };
  }

  async savePushToken(clerkId: string, token: string) {
    await this.prisma.user.update({
      where: { clerkId },
      data: { pushToken: token },
    });
  }

  async updateNotificationPrefs(clerkId: string, prefs: Record<string, boolean>) {
    await this.prisma.user.update({
      where: { clerkId },
      data: { notificationPrefs: prefs },
    });
  }
}
