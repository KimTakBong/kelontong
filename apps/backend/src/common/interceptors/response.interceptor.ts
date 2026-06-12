import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Wraps every successful response in the standard envelope so controllers never
// wrap manually (Architecture-Note §5):
//   - list results already shaped { data, meta }  → passed through
//   - everything else                              → { data: <result> }
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((payload) => {
        if (isPaginated(payload)) {
          return payload;
        }
        return { data: payload };
      }),
    );
  }
}

function isPaginated(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value
  );
}
