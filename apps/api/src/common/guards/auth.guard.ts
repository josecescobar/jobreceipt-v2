import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { RequestUser } from '../decorators/current-user.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const organizationId = Array.isArray(request.headers['x-org-id'])
      ? request.headers['x-org-id'][0]
      : request.headers['x-org-id'];

    if (token.startsWith('dev_')) {
      const nodeEnv = this.configService.get<string>('NODE_ENV', 'production');
      if (nodeEnv !== 'development' && nodeEnv !== 'test') {
        throw new UnauthorizedException('Dev tokens are not accepted in this environment');
      }

      const devUser: RequestUser = {
        clerkId: token,
        userId: token,
        organizationId,
      };
      (request as Request & { user: RequestUser }).user = devUser;
      return true;
    }

    try {
      const secretKey = this.configService.getOrThrow<string>('CLERK_SECRET_KEY');
      const payload = await verifyToken(token, { secretKey });

      const user: RequestUser = {
        clerkId: payload.sub,
        userId: payload.sub,
        organizationId,
      };

      (request as Request & { user: RequestUser }).user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token', { cause: error as Error });
    }
  }
}
