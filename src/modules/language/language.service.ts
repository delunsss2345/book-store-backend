import { CATEGORY_CACHE_TTL } from "@/common/constants/enum-ttl.constant";
import { LanguageRepository } from "@/modules/language/language.repository";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Cache } from "cache-manager";

@Injectable()
export class LanguageService {
    constructor(
        private readonly languageRepository: LanguageRepository,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) {

    }
    async resolveLanguage(
        lang?: string,
    ): Promise<{ id: number; code: string }> {
        const normalized = (lang ?? 'vi').trim().toLowerCase();
        const cacheKey = `lang:${normalized}`;

        // GET cached xem ngôn ngữ đó đã cached chưa, tránh gọi db
        const cached = await this.cache.get<{ id: number; code: string }>(cacheKey);
        if (cached) return cached;

        // Tìm trong bảng có ngôn ngữ này chưa
        const found = await this.languageRepository.findLanguageByCode(normalized);
        if (found) {
            await this.cache.set(cacheKey, found, CATEGORY_CACHE_TTL);
            return found;
        }

        // Trả về ngôn ngữ đầu tiên active
        const fallback = await this.languageRepository.findDefaultLanguage();
        if (!fallback) throw new NotFoundException('No active language found');

        await this.cache.set(cacheKey, fallback, CATEGORY_CACHE_TTL);
        return fallback;
    }
}
