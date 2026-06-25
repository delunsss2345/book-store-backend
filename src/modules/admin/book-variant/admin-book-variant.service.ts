import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import {
    AdminBookVariantsRepository,
    CreateBookVariantInput,
} from '@/modules/admin/book-variant/admin-book-variant.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    Inject,
    Injectable
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }


    createVariants(
        bookId: number,
        items: CreateBookVariantInput[],
        tx?: Prisma.TransactionClient,
    ) {
        return this.adminBookVariantsRepository.createVariants(bookId, items, tx);
    }

    async getBookVariants(
        query: AdminBookListQueryDto,
        langId: number,
    ) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const searchPhrase = undefined;

        const [total, rows] = await Promise.all([
            this.adminBookVariantsRepository.countBookVariants(langId, searchPhrase),
            this.adminBookVariantsRepository.findBookVariants(
                page,
                limit,
                langId,
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
