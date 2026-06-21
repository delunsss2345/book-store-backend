import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetGuestSessionId = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const guestSessionId = request['guestSessionId'] as string | undefined;
        return guestSessionId ?? null;
    },
);
