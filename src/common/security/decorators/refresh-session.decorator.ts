import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserSession } from '@prisma/client';

export const RefreshSession = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request['refreshSession'] as UserSession;
    },
);
