import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { Request, Response } from 'express';
import { createClerkClient } from '@clerk/backend';
import { AuthService } from './auth.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bootstrap current user — returns profile and organizations, auto-creates org if needed' })
  @ApiResponse({ status: 200, description: 'User profile with organizations' })
  async me(@Req() req: Request) {
    const clerkId = (req as any).clerkUserId;

    // Fetch user details from Clerk to get email/name
    const clerk = createClerkClient({ secretKey: this.configService.get<string>('clerk.secretKey') });
    const clerkUser = await clerk.users.getUser(clerkId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

    return this.authService.bootstrapUser(clerkId, email, name);
  }

  @Post('push-token')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register Expo push token for the current user' })
  @ApiResponse({ status: 200, description: 'Token saved' })
  async registerPushToken(
    @Req() req: Request,
    @Body() body: { token: string },
  ) {
    const clerkId = (req as any).clerkUserId;
    if (!body.token) {
      throw new BadRequestException('Token is required');
    }
    await this.authService.savePushToken(clerkId, body.token);
    return { success: true };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Clerk webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const webhookSecret = this.configService.get<string>('clerk.webhookSecret');

    if (!webhookSecret) {
      this.logger.error('CLERK_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing svix headers');
    }

    const wh = new Webhook(webhookSecret);
    let event: { type: string; data: any };

    try {
      // For raw body parsing, NestJS needs to be configured to pass raw body
      const body = JSON.stringify(req.body);
      event = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: any };
    } catch (err) {
      this.logger.error('Webhook verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received Clerk webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'user.created':
          await this.authService.handleUserCreated(event.data);
          break;
        case 'user.updated':
          await this.authService.handleUserUpdated(event.data);
          break;
        case 'user.deleted':
          await this.authService.handleUserDeleted(event.data);
          break;
        default:
          this.logger.log(`Unhandled webhook event: ${event.type}`);
      }
    } catch (err) {
      this.logger.error(`Error processing webhook ${event.type}`, err);
      // Don't throw — return 200 to prevent Clerk from retrying
    }

    return res.status(200).json({ received: true });
  }
}
