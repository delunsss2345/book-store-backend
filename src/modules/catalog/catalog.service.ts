import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
    CatalogBookListQueryDto,
    CatalogBookSort,
    CatalogCategoryBooksQueryDto,
    CatalogHomeQueryDto,
} from './dto/request';
import {
    CatalogBookCardDto,
    CatalogBookDetailDto,
    CatalogBookListResponseDto,
    CatalogBookVariantDto,
    CatalogCategoryDto,
    CatalogHomeResponseDto,
} from './dto/response';
import { CatalogRepository } from './catalog.repository';

const HOME_CACHE_TTL = 60_000;
const LIST_CACHE_TTL = 45_000;
const DETAIL_CACHE_TTL = 120_000;
const CATEGORY_CACHE_TTL = 60_000;

type RankingMapValue = {
    value: number;
};

@Injectable()
export class CatalogService {
    constructor(
        private readonly catalogRepository: CatalogRepository,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    async getCatalogHome(query: CatalogHomeQueryDto): Promise<CatalogHomeResponseDto> {
        const limit = query.limit ?? 12;
        const language = await this.resolveLanguage(query.lang);
        const cacheKey = `catalog:home:${language.code}:${limit}`;

        const cached = await this.cacheManager.get<CatalogHomeResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        const [categoriesRaw, newestRows, allRatings, allSalesRows] = await Promise.all([
            this.catalogRepository.findActiveCategoriesByLanguage(language.id),
            this.catalogRepository.findNewestActiveBookIds(language.id, limit),
            this.catalogRepository.groupBookRatings(),
            this.catalogRepository.groupBookSales(),
        ]);

        const categories = categoriesRaw.map((row): CatalogCategoryDto => {
            const translation = row.categoryTranslation[0];
            return {
                id: row.id.toString(),
                parentId: row.parentId?.toString() ?? null,
                name: translation?.name ?? `Category ${row.id.toString()}`,
                slug: translation?.slug ?? null,
                sortOrder: row.sortOrder,
            };
        });

        const newestIds = newestRows.map((row) => row.id);
        const salesMap = this.buildSalesMap(allSalesRows);
        const ratingMap = this.buildRatingMap(allRatings);

        const bestSellerIds = this.takeTopIdsByMap(salesMap, limit);
        const topRatedIds = this.takeTopIdsByMap(ratingMap, limit);
        const recommendIds = this.buildRecommendIds({ newestIds, bestSellerIds, topRatedIds, limit });

        const uniqueIds = this.uniqueBigIntIds([
            ...newestIds,
            ...bestSellerIds,
            ...topRatedIds,
            ...recommendIds,
        ]);

        const books = await this.catalogRepository.findBooksByIds(uniqueIds, language.id);
        const cardMap = new Map<string, CatalogBookCardDto>();

        for (const book of books) {
            const sales = salesMap.get(book.id.toString());
            const rating = ratingMap.get(book.id.toString());
            cardMap.set(book.id.toString(), this.toBookCard(book, sales?.value, rating?.value, rating?.count));
        }

        const response: CatalogHomeResponseDto = {
            categories,
            newArrivals: newestIds.map((id) => cardMap.get(id.toString())).filter(Boolean) as CatalogBookCardDto[],
            bestSeller: bestSellerIds.map((id) => cardMap.get(id.toString())).filter(Boolean) as CatalogBookCardDto[],
            topRated: topRatedIds.map((id) => cardMap.get(id.toString())).filter(Boolean) as CatalogBookCardDto[],
            recommend: recommendIds.map((id) => cardMap.get(id.toString())).filter(Boolean) as CatalogBookCardDto[],
            generatedAt: new Date(),
        };

        await this.cacheManager.set(cacheKey, response, HOME_CACHE_TTL);
        return response;
    }

    async listBooks(query: CatalogBookListQueryDto): Promise<CatalogBookListResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const sort = query.sort ?? CatalogBookSort.NEWEST;
        const language = await this.resolveLanguage(query.lang);
        const q = query.q?.trim();
        const categoryId = this.parseBigInt(query.categoryId);

        const cacheKey = `catalog:list:${language.code}:p${page}:l${limit}:q=${q ?? ''}:cat=${query.categoryId ?? ''}:sort=${sort}`;
        const cached = await this.cacheManager.get<CatalogBookListResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        const candidates = await this.catalogRepository.findActiveBookRows({
            languageId: language.id,
            q,
            categoryId,
        });

        const total = candidates.length;
        if (!total) {
            const empty: CatalogBookListResponseDto = {
                page,
                limit,
                total: 0,
                totalPages: 0,
                items: [],
            };
            await this.cacheManager.set(cacheKey, empty, LIST_CACHE_TTL);
            return empty;
        }

        const candidateIds = candidates.map((row) => row.id);
        const createdAtMap = new Map<string, Date>(
            candidates.map((row) => [row.id.toString(), row.createdAt]),
        );

        const sortedIds = await this.sortBookIds({
            sort,
            candidateIds,
            createdAtMap,
            languageId: language.id,
        });

        const offset = (page - 1) * limit;
        const pageIds = sortedIds.slice(offset, offset + limit);

        const [books, ratingRows, salesRows] = await Promise.all([
            this.catalogRepository.findBooksByIds(pageIds, language.id),
            this.catalogRepository.groupBookRatings(pageIds),
            this.catalogRepository.groupBookSales(pageIds),
        ]);

        const ratingMap = this.buildRatingMap(ratingRows);
        const salesMap = this.buildSalesMap(salesRows);
        const cardMap = new Map<string, CatalogBookCardDto>();

        for (const book of books) {
            const sales = salesMap.get(book.id.toString());
            const rating = ratingMap.get(book.id.toString());
            cardMap.set(book.id.toString(), this.toBookCard(book, sales?.value, rating?.value, rating?.count));
        }

        const response: CatalogBookListResponseDto = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            items: pageIds.map((id) => cardMap.get(id.toString())).filter(Boolean) as CatalogBookCardDto[],
        };

        await this.cacheManager.set(cacheKey, response, LIST_CACHE_TTL);
        return response;
    }

    async getBookDetail(bookId: bigint, lang?: string): Promise<CatalogBookDetailDto> {
        const language = await this.resolveLanguage(lang);
        const cacheKey = `catalog:detail:${bookId.toString()}:${language.code}`;

        const cached = await this.cacheManager.get<CatalogBookDetailDto>(cacheKey);
        if (cached) {
            return cached;
        }

        const book = await this.catalogRepository.findBookDetailById(bookId, language.id);
        if (!book) {
            throw new NotFoundException('Book not found');
        }

        const [ratingRows, salesRows] = await Promise.all([
            this.catalogRepository.groupBookRatings([book.id]),
            this.catalogRepository.groupBookSales([book.id]),
        ]);

        const ratingMap = this.buildRatingMap(ratingRows);
        const salesMap = this.buildSalesMap(salesRows);
        const rating = ratingMap.get(book.id.toString());
        const sales = salesMap.get(book.id.toString());

        const variants: CatalogBookVariantDto[] = book.variants.map((variant) => ({
            id: variant.id.toString(),
            format: variant.format,
            edition: variant.edition,
            isbn: variant.isbn,
            price: variant.price.toString(),
            currencyCode: variant.currencyCode,
            stock: variant.stock,
        }));

        const categoryDtos: CatalogCategoryDto[] = book.categories.map(({ category }) => {
            const translation = category.categoryTranslation[0];
            return {
                id: category.id.toString(),
                parentId: category.parentId?.toString() ?? null,
                name: translation?.name ?? `Category ${category.id.toString()}`,
                slug: translation?.slug ?? null,
                sortOrder: category.sortOrder,
            };
        });

        const priceRange = this.getVariantPriceRange(book.variants);
        const translation = book.translations[0];

        const response: CatalogBookDetailDto = {
            id: book.id.toString(),
            title: translation?.title ?? `Book ${book.id.toString()}`,
            slug: translation?.slug ?? null,
            description: translation?.description ?? null,
            coverImageUrl: book.coverImageUrl,
            publicationYear: book.publicationYear,
            pageCount: book.pageCount,
            weightGrams: book.weightGrams,
            publisherName: book.publisher?.defaultName ?? null,
            minPrice: priceRange.minPrice,
            maxPrice: priceRange.maxPrice,
            currencyCode: priceRange.currencyCode,
            ratingAvg: rating?.value ?? null,
            ratingCount: rating?.count ?? 0,
            soldCount: sales?.value ?? 0,
            categories: categoryDtos,
            variants,
            createdAt: book.createdAt,
        };

        await this.cacheManager.set(cacheKey, response, DETAIL_CACHE_TTL);
        return response;
    }

    async listCategories(lang?: string): Promise<CatalogCategoryDto[]> {
        const language = await this.resolveLanguage(lang);
        const cacheKey = `catalog:categories:${language.code}`;

        const cached = await this.cacheManager.get<CatalogCategoryDto[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const rows = await this.catalogRepository.findActiveCategoriesByLanguage(language.id);
        const response = rows.map((row): CatalogCategoryDto => {
            const translation = row.categoryTranslation[0];
            return {
                id: row.id.toString(),
                parentId: row.parentId?.toString() ?? null,
                name: translation?.name ?? `Category ${row.id.toString()}`,
                slug: translation?.slug ?? null,
                sortOrder: row.sortOrder,
            };
        });

        await this.cacheManager.set(cacheKey, response, CATEGORY_CACHE_TTL);
        return response;
    }

    listBooksByCategory(categoryId: bigint, query: CatalogCategoryBooksQueryDto) {
        return this.listBooks({
            lang: query.lang,
            page: query.page,
            limit: query.limit,
            sort: query.sort,
            categoryId: categoryId.toString(),
        });
    }

    private async sortBookIds(params: {
        sort: CatalogBookSort;
        candidateIds: bigint[];
        createdAtMap: Map<string, Date>;
        languageId: number;
    }): Promise<bigint[]> {
        const { sort, candidateIds, createdAtMap, languageId } = params;

        if (sort === CatalogBookSort.NEWEST) {
            return [...candidateIds].sort((a, b) => {
                const createdA = createdAtMap.get(a.toString())?.getTime() ?? 0;
                const createdB = createdAtMap.get(b.toString())?.getTime() ?? 0;
                if (createdA !== createdB) {
                    return createdB - createdA;
                }
                if (a === b) {
                    return 0;
                }
                return a < b ? 1 : -1;
            });
        }

        if (sort === CatalogBookSort.PRICE_ASC || sort === CatalogBookSort.PRICE_DESC) {
            const books = await this.catalogRepository.findBooksByIds(candidateIds, languageId);
            const priceMap = new Map<string, number>();

            for (const book of books) {
                const prices = book.variants.map((variant) => Number(variant.price));
                if (!prices.length) {
                    continue;
                }
                const minPrice = Math.min(...prices);
                priceMap.set(book.id.toString(), minPrice);
            }

            return [...candidateIds].sort((a, b) => {
                const priceA = priceMap.get(a.toString()) ?? Number.MAX_SAFE_INTEGER;
                const priceB = priceMap.get(b.toString()) ?? Number.MAX_SAFE_INTEGER;
                if (priceA !== priceB) {
                    return sort === CatalogBookSort.PRICE_ASC ? priceA - priceB : priceB - priceA;
                }

                const createdA = createdAtMap.get(a.toString())?.getTime() ?? 0;
                const createdB = createdAtMap.get(b.toString())?.getTime() ?? 0;
                return createdB - createdA;
            });
        }

        if (sort === CatalogBookSort.TOP_RATED) {
            const ratings = await this.catalogRepository.groupBookRatings(candidateIds);
            const ratingMap = this.buildRatingMap(ratings);

            return [...candidateIds].sort((a, b) => {
                const scoreA = ratingMap.get(a.toString())?.value ?? 0;
                const scoreB = ratingMap.get(b.toString())?.value ?? 0;
                if (scoreA !== scoreB) {
                    return scoreB - scoreA;
                }

                const createdA = createdAtMap.get(a.toString())?.getTime() ?? 0;
                const createdB = createdAtMap.get(b.toString())?.getTime() ?? 0;
                return createdB - createdA;
            });
        }

        const sales = await this.catalogRepository.groupBookSales(candidateIds);
        const salesMap = this.buildSalesMap(sales);

        return [...candidateIds].sort((a, b) => {
            const scoreA = salesMap.get(a.toString())?.value ?? 0;
            const scoreB = salesMap.get(b.toString())?.value ?? 0;
            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            const createdA = createdAtMap.get(a.toString())?.getTime() ?? 0;
            const createdB = createdAtMap.get(b.toString())?.getTime() ?? 0;
            return createdB - createdA;
        });
    }

    private takeTopIdsByMap(map: Map<string, RankingMapValue>, limit: number): bigint[] {
        return [...map.entries()]
            .sort((a, b) => b[1].value - a[1].value)
            .slice(0, limit)
            .map(([id]) => BigInt(id));
    }

    private buildRecommendIds(params: {
        newestIds: bigint[];
        bestSellerIds: bigint[];
        topRatedIds: bigint[];
        limit: number;
    }): bigint[] {
        const newestRank = new Map<string, number>();
        params.newestIds.forEach((id, index) => newestRank.set(id.toString(), params.limit - index));

        const bestSellerRank = new Map<string, number>();
        params.bestSellerIds.forEach((id, index) => bestSellerRank.set(id.toString(), params.limit - index));

        const topRatedRank = new Map<string, number>();
        params.topRatedIds.forEach((id, index) => topRatedRank.set(id.toString(), params.limit - index));

        const allIds = this.uniqueBigIntIds([
            ...params.newestIds,
            ...params.bestSellerIds,
            ...params.topRatedIds,
        ]);

        if (!allIds.length) {
            return params.newestIds.slice(0, params.limit);
        }

        const scored = allIds.map((id) => {
            const key = id.toString();
            const score =
                (bestSellerRank.get(key) ?? 0) * 0.5 +
                (topRatedRank.get(key) ?? 0) * 0.35 +
                (newestRank.get(key) ?? 0) * 0.15;

            return {
                id,
                score,
            };
        });

        const ranked = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, params.limit)
            .map((item) => item.id);

        if (!ranked.length) {
            return params.newestIds.slice(0, params.limit);
        }

        return ranked;
    }

    private buildSalesMap(
        rows: Awaited<ReturnType<CatalogRepository['groupBookSales']>>,
    ): Map<string, RankingMapValue> {
        const result = new Map<string, RankingMapValue>();

        for (const row of rows) {
            const bookId = row.variant?.bookId;
            if (!bookId) {
                continue;
            }

            const key = bookId.toString();
            const current = result.get(key)?.value ?? 0;
            result.set(key, { value: current + row.quantity });
        }

        return result;
    }

    private buildRatingMap(
        rows: Awaited<ReturnType<CatalogRepository['groupBookRatings']>>,
    ): Map<string, RankingMapValue & { count: number }> {
        const result = new Map<string, RankingMapValue & { count: number }>();

        for (const row of rows) {
            result.set(row.bookId.toString(), {
                value: Number(row._avg.rating ?? 0),
                count: row._count.bookId,
            });
        }

        return result;
    }

    private toBookCard(
        book: Awaited<ReturnType<CatalogRepository['findBooksByIds']>>[number],
        soldCount?: number,
        ratingAvg?: number,
        ratingCount?: number,
    ): CatalogBookCardDto {
        const translation = book.translations[0];
        const priceRange = this.getVariantPriceRange(book.variants);

        return {
            id: book.id.toString(),
            title: translation?.title ?? `Book ${book.id.toString()}`,
            slug: translation?.slug ?? null,
            coverImageUrl: book.coverImageUrl,
            minPrice: priceRange.minPrice,
            maxPrice: priceRange.maxPrice,
            currencyCode: priceRange.currencyCode,
            ratingAvg: ratingAvg ?? null,
            ratingCount: ratingCount ?? 0,
            soldCount: soldCount ?? 0,
            createdAt: book.createdAt,
        };
    }

    private getVariantPriceRange(
        variants: Array<{ price: { toString(): string }; currencyCode: string | null }>,
    ) {
        if (!variants.length) {
            return {
                minPrice: null,
                maxPrice: null,
                currencyCode: null,
            };
        }

        const prices = variants.map((variant) => Number(variant.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const currencyCode = variants.find((variant) => !!variant.currencyCode)?.currencyCode ?? null;

        return {
            minPrice: Number.isFinite(minPrice) ? minPrice.toFixed(2) : null,
            maxPrice: Number.isFinite(maxPrice) ? maxPrice.toFixed(2) : null,
            currencyCode,
        };
    }

    private uniqueBigIntIds(ids: bigint[]): bigint[] {
        return [...new Map(ids.map((id) => [id.toString(), id])).values()];
    }

    private parseBigInt(value?: string): bigint | undefined {
        if (!value) {
            return undefined;
        }

        try {
            return BigInt(value);
        } catch {
            return undefined;
        }
    }

    private async resolveLanguage(lang?: string): Promise<{ id: number; code: string }> {
        const normalized = (lang ?? 'vi').trim().toLowerCase();
        const cacheKey = `catalog:lang:${normalized}`;

        const cached = await this.cacheManager.get<{ id: number; code: string }>(cacheKey);
        if (cached) {
            return cached;
        }

        const found = await this.catalogRepository.findLanguageByCode(normalized);
        if (found) {
            await this.cacheManager.set(cacheKey, found, CATEGORY_CACHE_TTL);
            return found;
        }

        const fallback = await this.catalogRepository.findDefaultLanguage();
        if (!fallback) {
            throw new NotFoundException('No active language found');
        }

        await this.cacheManager.set(cacheKey, fallback, CATEGORY_CACHE_TTL);
        return fallback;
    }
}
