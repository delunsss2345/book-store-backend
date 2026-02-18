import { CatalogService } from '@/modules/catalog/catalog.service';
import { PineconeService } from '@/modules/pinecone/pinecone.service';
import { SearchBooksQueryDto } from '@/modules/search/dto/request';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class SearchService {
    constructor(
        private readonly catalogService: CatalogService,
        private readonly pineconeService: PineconeService,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) { }
    // Search sách theo query , topK format maxPrice categoryId
    async searchBooks(query: SearchBooksQueryDto): Promise<any> {
        const q = query.q?.trim();
        if (!q) {
            throw new BadRequestException('q is required');
        }
        const cacheKey = `query:books-sematic:${query.q}`
        const cached = await this.cache.get<any>(cacheKey);
        if (cached) return cached;

        const limit = query.limit ?? 10;
        const page = query.page ?? 1;

        // truyền query 
        const matches = await this.pineconeService.queryBooks({
            query: q,
            topK: limit
        });

        if (!matches.length) {
            return [];
        }

        const orderedBookIdStrings = Array.from(
            new Set(matches.map((match) => match.bookId)),
        );
        const orderedBookIds = orderedBookIdStrings.map((id) => BigInt(id));

        const rankByBookId = new Map(
            orderedBookIdStrings.map((id, index) => [id, index]),
        );

        const cartBooks = await this.catalogService.queryListBook(
            {
                lang: 'vi',
                page: page ?? 1,
                limit,
            },
            orderedBookIds,
        );

        const sortedItems = [...cartBooks.items].sort((a, b) => {
            const rankA = rankByBookId.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const rankB = rankByBookId.get(b.id) ?? Number.MAX_SAFE_INTEGER;
            return rankA - rankB;
        });

        return {
            ...cartBooks,
            items: sortedItems,
        };

    }

    async reindexBooks() {
        return this.pineconeService.fullReindexBooks();
    }
}
