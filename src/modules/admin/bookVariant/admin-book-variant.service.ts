import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { AdminBookVariantsRepository } from '@/modules/admin/bookVariant/admin-book-variant.repository';
import { LanguageService } from '@/modules/language/language.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    Inject,
    Injectable
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
    AdminBookListQueryDto
} from '../dto/request';


const ADMIN_STATS_CACHE_KEY = 'admin:stats';
const ADMIN_STATS_CACHE_TTL = 86_400_000;

@Injectable()
export class AdminBookVariantsService {
    constructor(
        private readonly adminBookVariantsRepository: AdminBookVariantsRepository,
        private readonly languageService: LanguageService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }


    async getBookVariants(
        query: AdminBookListQueryDto,
        lang: string,
    ) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const searchPhrase = query.searchPhrase?.trim() || undefined;
        const language = await this.languageService.resolveLanguage(lang);

        const [total, rows] = await Promise.all([
            this.adminBookVariantsRepository.countBookVariants(language.id, searchPhrase),
            this.adminBookVariantsRepository.findBookVariants(
                page,
                limit,
                language.id,
                searchPhrase,
            ),
        ]);

        return buildPaginatedResult(
            rows.map((row) => (row)),
            total,
            page,
            limit,
        );
    }


}
