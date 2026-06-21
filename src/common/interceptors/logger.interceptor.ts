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
            const headers = (request.headers);
            Logger.log(`Request headers...`);
            Logger.log(headers);
        }
        if (request.body) {
            const body = (request.body);
            Logger.log(`Request body...`);
            Logger.log(body);
        }
        const now = Date.now();
        return next
            .handle()
            .pipe(
                tap((data) => {
                    console.log(`After... ${Date.now() - now}ms`)
                    // Logger.log(data);
                }));
    }
}
