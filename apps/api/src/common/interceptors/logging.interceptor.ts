import {
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import { RequestContextService } from '../request-context/request-context.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        const requestId = this.requestContext.getRequestId() ?? 'n/a';

        this.logger.log(
          JSON.stringify({
            requestId,
            method: request.method,
            path: request.originalUrl,
            statusCode: response.statusCode,
            durationMs: duration,
          }),
        );
      }),
    );
  }
}
