import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetLanguageId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request['language']?.id;
  },
);
