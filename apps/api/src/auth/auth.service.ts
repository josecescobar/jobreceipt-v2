import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import type { ClerkUserPayload, ClerkWebhookEvent } from './auth.types';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private verifyWebhookHeader(request: Request): void {
    const expectedSecret = this.configService.getOrThrow<string>('CLERK_WEBHOOK_SECRET');
    const provided = request.headers['x-clerk-webhook-secret'];
    const candidate = Array.isArray(provided) ? provided[0] : provided;

    if (!candidate || candidate !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  private extractPrimaryEmail(payload: ClerkUserPayload): string {
    if (!payload.email_addresses?.length) {
      return `no-email-${payload.id}@jobreceipt.local`;
    }

    const primary = payload.email_addresses.find((email) => email.id === payload.primary_email_address_id);
    return primary?.email_address ?? payload.email_addresses[0].email_address;
  }

  async handleClerkWebhook(request: Request, event: ClerkWebhookEvent): Promise<{ processed: boolean }> {
    this.verifyWebhookHeader(request);

    if (!event.type.startsWith('user.')) {
      return { processed: false };
    }

    const email = this.extractPrimaryEmail(event.data);
    const fullName = [event.data.first_name, event.data.last_name].filter(Boolean).join(' ').trim() || null;
    const phone = event.data.phone_numbers?.[0]?.phone_number ?? null;

    await this.prisma.user.upsert({
      where: { clerkId: event.data.id },
      create: {
        clerkId: event.data.id,
        email,
        name: fullName,
        phone,
        role: UserRole.OWNER,
      },
      update: {
        email,
        name: fullName,
        phone,
      },
    });

    return { processed: true };
  }

  async getProfile(auth: RequestUser) {
    const user = await this.prisma.user.findFirst({
      where: { clerkId: auth.clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(auth: RequestUser, dto: UpdateProfileDto) {
    const result = await this.prisma.user.updateMany({
      where: { clerkId: auth.clerkId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('User not found');
    }

    return this.getProfile(auth);
  }
}
