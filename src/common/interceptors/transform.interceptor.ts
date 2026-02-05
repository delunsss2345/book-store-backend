import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { HttpMessage } from 'src/constants/http-message.constant'
import { ResponseDto } from 'src/interfaces/gateway/response.interface'

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
        const res = context.switchToHttp().getResponse()
        const statusCode = res?.statusCode ?? HttpStatus.OK

        return next.handle().pipe(
            map((data) => ResponseDto.success({
                statusCode,
                data,
                message: HttpMessage.OK,
            })),
        )
    }
}
