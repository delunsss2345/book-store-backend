import { Status } from '@common/constants/enum.constant';
import { HttpStatus } from '@nestjs/common';

export class ResponseDto<T> {
    success: boolean;
    statusCode: number = HttpStatus.OK;
    message?: string;
    data?: T;
    path?: string;

    constructor(payload: Partial<ResponseDto<T>>) {
        Object.assign(this, payload);
    }

    public static error({
        statusCode,
        message,
        path,
    }: {
        statusCode: number;
        message: string;
        path: string;
    }) {
        return new ResponseDto({
            success: Boolean(Status.NO),
            statusCode,
            message,
            path,
        });
    }

    public static success<T>({
        data,
        statusCode = HttpStatus.OK,
        message,
    }: {
        data: T;
        statusCode?: number;
        message?: string;
    }) {
        return new ResponseDto<T>({
            success: Boolean(Status.OK),
            statusCode,
            message,
            data,
        });
    }
}
