import { HttpStatus } from '@nestjs/common';

class ResponseDto<T> {
    success: string;
    statusCode: HttpStatus.OK;
    message: string;
    data?: T;
}
