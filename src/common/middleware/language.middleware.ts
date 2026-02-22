import { LanguageService } from '@/modules/language/language.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
    constructor(private readonly languageService: LanguageService) { }

    async use(req: Request, _: Response, next: NextFunction) {
        const queryLang =
            typeof req.query?.lang === 'string' && req.query.lang.trim() !== ''
                ? req.query.lang
                : undefined;
        const headerLang =
            typeof req.headers['x-app-lang'] === 'string' && req.headers['x-app-lang'].trim() !== ''
                ? req.headers['x-app-lang']
                : undefined;
        const candidate = queryLang ?? headerLang;

        req['language'] = await this.languageService.resolveLanguage(candidate);
        next();
    }
}
