import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { User } from '../users/entities/user.entity';
import { ApiLogsService } from './api-logs.service';

// Fields scrubbed from the persisted request body.
const SENSITIVE_FIELDS = ['password', 'confirmPassword', 'currentPassword'];

// Records every request after the response is sent (finalize), so it adds no
// latency to the request itself (Architecture-Note §4).
@Injectable()
export class ApiLogsInterceptor implements NestInterceptor {
  constructor(private readonly apiLogsService: ApiLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const user = request.user as User | undefined;
        void this.apiLogsService.record({
          method: request.method,
          path: request.originalUrl.split('?')[0],
          statusCode: response.statusCode,
          duration: Date.now() - startedAt,
          ip: request.ip ?? null,
          userAgent: request.headers['user-agent'] ?? null,
          userId: user?.id ?? null,
          requestBody: this.sanitizeBody(request),
        });
      }),
    );
  }

  // Only persist a body for mutations, with sensitive keys removed.
  private sanitizeBody(request: Request): Record<string, unknown> | null {
    if (!['POST', 'PATCH', 'PUT'].includes(request.method)) return null;
    const body = request.body as Record<string, unknown> | undefined;
    if (!body || typeof body !== 'object') return null;

    const clone: Record<string, unknown> = { ...body };
    for (const field of SENSITIVE_FIELDS) {
      if (field in clone) delete clone[field];
    }
    return clone;
  }
}
