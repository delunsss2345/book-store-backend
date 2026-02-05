import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseDto } from 'src/interfaces/gateway/response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'string' ? res : (res as any).message ?? res;
        } else if (exception instanceof Error) {
            message = exception.message ?? message;
        }

        return response.status(status).json(
            ResponseDto.error({
                statusCode: status,
                path: request.url,
                message: typeof message === 'string' ? message : JSON.stringify(message),
            }),
        );
    }
}
