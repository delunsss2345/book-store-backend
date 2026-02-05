import { HttpStatus } from '@nestjs/common';
import { Status } from 'src/constants/enum.constant';
import { HttpMessage } from 'src/constants/http-message.constant';

export class ResponseDto<T> {
    success: Status.OK;
    statusCode: HttpStatus.OK;
    message: HttpMessage.OK;
    data?: T;

    constructor(payload: Partial<ResponseDto<T>>) {
        Object.assign(this, payload)
    }
}
