import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { Request, Response } from 'express';

/** Global filter: reports 5xx errors to Sentry and returns a consistent JSON envelope. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      Sentry.captureException(exception);
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      path: request?.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
