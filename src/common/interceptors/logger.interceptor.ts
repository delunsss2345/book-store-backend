import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        console.log('Before...');
        Logger.log(`Request... ${request.method} ${request.url}`);
        if (request.headers) {
            Logger.log(`Request headers... ${JSON.stringify(request.headers)}`);
        }
        if (request.body) {
            Logger.log(`Request body... ${JSON.stringify(request.body)}`);
        }
        const now = Date.now();
        return next
            .handle()
            .pipe(
                tap(() => console.log(`After... ${Date.now() - now}ms`)),
            );
    }
}
