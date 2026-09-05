import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { RequestContextService } from '../request-context/request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestIdHeader = req.headers['x-request-id'];
    const organizationIdHeader = req.headers['x-org-id'];
    const userIdHeader = req.headers['x-user-id'];

    const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader || randomUUID();
    const organizationId = Array.isArray(organizationIdHeader) ? organizationIdHeader[0] : organizationIdHeader;
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;

    this.requestContext.run(
      {
        requestId,
        organizationId,
        userId,
      },
      () => {
        res.setHeader('x-request-id', requestId);
        next();
      },
    );
  }
}
