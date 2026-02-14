import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  constructor(private prisma: PrismaService) {}

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
}
