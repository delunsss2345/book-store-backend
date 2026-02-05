import { HttpStatus } from '@nestjs/common';
import { Status } from 'src/constants/enum.constant';
import { HttpMessage } from 'src/constants/http-message.constant';

export class ResponseDto<T> {
    success: Status = Status.OK;
    statusCode: HttpStatus = HttpStatus.OK;
    message: string = HttpMessage.OK;
    data?: T;
    path?: string
    constructor(payload: Partial<ResponseDto<T>>) {
        Object.assign(this, payload)
    }
    public static error({ statusCode, path, message }: { message: string, statusCode: HttpStatus, path: string }) {
        return new ResponseDto({
            success: Status.NO,
            statusCode,
            path,
            message
        })
    }
    public static success<T>({ statusCode, data, message }: { message: string, statusCode: HttpStatus, data: T }) {
        return new ResponseDto<T>({
            statusCode,
            data,
            message
        })
    }
}
