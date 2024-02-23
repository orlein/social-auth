import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    const before = Date.now();
    return next.handle().pipe(
      tap(() => {
        this.logger.log(JSON.stringify(request.body), 'REQUEST');
      }),
      map((data) => {
        this.logger.log(JSON.stringify(data), 'RESPONSE');
        return data;
      }),
      tap(() => {
        const after = Date.now();
        return this.logger.log(
          `${request.method} ${request.path} ${after - before}ms `,
          'REQUEST',
        );
      }),
    );
  }
}
