// import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
// import { Histogram } from 'prom-client';
// import { Observable, tap } from 'rxjs';

// const httpRequestDuration = new Histogram({
//     name: 'http_request_duration_seconds',
//     help: 'Duration of HTTP requests in seconds',
//     labelNames: ['method', 'route', 'status_code', "name", "controller"],
//     buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
// });

// @Injectable()
// export class MertricInterceptor implements NestInterceptor {
//     intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
//         const req = context.switchToHttp().getRequest();
//         const end = httpRequestDuration.startTimer();
//         return next.handle().pipe(
//             tap(() => {
//                 const res = context.switchToHttp().getResponse();
//                 end({
//                     method: req.method,
//                     route: req.route?.path ?? req.path,
//                     status_code: res.statusCode,
//                     name: context.getHandler().name,
//                     controller: context.getClass().name
//                 })
//             })
//         )
//     }
// }