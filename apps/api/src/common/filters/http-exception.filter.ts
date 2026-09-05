import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RequestContextService } from '../request-context/request-context.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly requestContext: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = this.requestContext.getRequestId();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = isHttpException ? exception.getResponse() : 'Internal Server Error';

    this.logger.error(
      JSON.stringify({
        requestId,
        method: request.method,
        path: request.originalUrl,
        status,
        error: errorResponse,
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      path: request.originalUrl,
      requestId,
      error: errorResponse,
      timestamp: new Date().toISOString(),
    });
  }
}
