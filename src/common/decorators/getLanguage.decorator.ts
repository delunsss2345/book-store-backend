import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @deprecated Prefer `GetLanguageId` for internal service flows or `GetLanguageCode`
 * when a string language code is explicitly required.
 */
export const GetLanguage = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request['language']?.code ?? 'vi';
    },
);
