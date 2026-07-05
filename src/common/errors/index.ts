import { HttpException } from "@nestjs/common";

export class TooManyRequestException extends HttpException {
    constructor() {
        super('Too Many Requests', 429);
    }
}