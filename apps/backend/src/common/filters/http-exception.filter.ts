import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorDetail {
  field: string;
  message: string;
}

// Normalizes every thrown error into the contract's error envelope:
//   { error: { code, message, details? } }
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: ErrorDetail[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      ({ message, details } = this.extract(res, message));
    } else if (exception instanceof Error) {
      // Unexpected error — log the stack, hide internals from the client.
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      error: { code: status, message, ...(details ? { details } : {}) },
    });
  }

  private extract(
    res: string | object,
    fallback: string,
  ): { message: string; details?: ErrorDetail[] } {
    if (typeof res === 'string') {
      return { message: res };
    }

    const body = res as Record<string, unknown>;

    // Our custom validation payload already carries structured details.
    if (Array.isArray(body.details)) {
      return {
        message: (body.message as string) ?? 'Validation failed',
        details: body.details as ErrorDetail[],
      };
    }

    // Plain Nest exceptions: message can be a string or string[].
    if (typeof body.message === 'string') {
      return { message: body.message };
    }
    if (Array.isArray(body.message)) {
      return {
        message: 'Validation failed',
        details: body.message.map((m) => ({ field: '', message: String(m) })),
      };
    }

    return { message: fallback };
  }
}
