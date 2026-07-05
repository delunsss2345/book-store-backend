import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetOriginUrl = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request['x-origin-url'] ?? 'localhost:3001'
    },
);
