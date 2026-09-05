import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  clerkId: string;
  userId?: string;
  organizationId?: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as RequestUser | undefined;
});
