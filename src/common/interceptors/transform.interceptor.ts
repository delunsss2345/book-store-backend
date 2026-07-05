import { ResponseDto } from '@common/dto';
import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
        const res = context.switchToHttp().getResponse();
        const statusCode = res?.statusCode ?? HttpStatus.OK;

        return next.handle().pipe(
            map((data) => ResponseDto.success({
                statusCode,
                data,
            })),
        );
    }
}
