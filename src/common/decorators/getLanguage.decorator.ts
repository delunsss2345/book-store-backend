import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetLanguage = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request['language']?.code ?? 'vi';
    },
);
