import { CatalogHomeQueryDto } from '@/modules/catalog/dto/request';
import { CatalogBookCardDto, CatalogBookDetailDto, CatalogBookVariantDto, CatalogCategoryDto } from '@/modules/catalog/dto/response';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CatalogRepository } from './catalog.repository';

const HOME_CACHE_TTL = 60_000;
const LIST_CACHE_TTL = 45_000;
const DETAIL_CACHE_TTL = 120_000;
const CATEGORY_CACHE_TTL = 60_000;

type RatingInfo = { value: number; count: number };
type SalesInfo = { value: number };

@Injectable()
export class CatalogService {
    constructor(
        private readonly repo: CatalogRepository,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) { }

    // Lấy giớ hạn không lấy phân trang
    async getCatalogHome(query: CatalogHomeQueryDto): Promise<any> {
        const limit = query.limit ?? 10;
        const lang = await this.resolveLanguage(query.lang);
        const cacheKey = `catalog:home:${lang.code}:${limit}`;

        return this.withCache(cacheKey, HOME_CACHE_TTL, async () => {
            const [newestRows, ratingTopLimit, saleTopLimit] = await Promise.all([
                this.repo.findNewestActiveBookIds(lang.id, limit),
                this.repo.groupBookRatings(limit),
                this.repo.groupBookSales(limit),
            ]);
            const newestIds = newestRows.map((r) => r.id);

            const topRatedIdsVariant = ratingTopLimit.map((r) =>
                BigInt(r.bookVariantId),
            );
            const bestSellerIdsVariant = saleTopLimit.map((r) =>
                BigInt(r.bookVariantId),
            );

            const allUniqueIds = this.uniqueBigIntIds([
                ...topRatedIdsVariant,
                ...bestSellerIdsVariant,
            ]);
            const cardMap = await this.buildCardMap(newestIds, lang.id);
            const cardMapVariant = await this.buildCardVariantMap(
                allUniqueIds,
                lang.id,
            );

            return {
                newArrivals: this.pickCards(newestIds, cardMap),
                bestSeller: this.pickCards(bestSellerIdsVariant, cardMapVariant),
                topRated: this.pickCards(topRatedIdsVariant, cardMapVariant),
            };
        });
    }

    private async buildCardMap(
        ids: bigint[],
        languageId: number,
    ): Promise<Map<string, CatalogBookCardDto>> {
        const books = await this.repo.findBooksByIds(ids, languageId);
        return new Map<string, CatalogBookCardDto>(
            books.map((book): [string, CatalogBookCardDto] => [
                book.id.toString(),
                this.toBookCard(book),
            ]),
        );
    }

    private async buildCardVariantMap(
        ids: bigint[],
        languageId: number,
    ): Promise<Map<string, CatalogBookCardDto>> {
        const variants = await this.repo.findBooksVariantByIds(ids, languageId);
        return new Map<string, CatalogBookCardDto>(
            variants.map((variant): [string, CatalogBookCardDto] => [
                variant.id.toString(),
                this.toVariantBookCard(variant),
            ]),
        );
    }

    // async listBooks(query: CatalogBookListQueryDto): Promise<CatalogBookListResponseDto> {
    //     const page = query.page ?? 1;
    //     const limit = query.limit ?? 20;
    //     const sort = query.sort ?? CatalogBookSort.NEWEST;
    //     const lang = await this.resolveLanguage(query.lang);

    //     const q = query.q?.trim();
    //     const categoryId = this.parseBigInt(query.categoryId);

    //     const cacheKey = `catalog:list:${lang.code}:p${page}:l${limit}:q=${q ?? ''}:cat=${query.categoryId ?? ''}:sort=${sort}`;

    //     return this.withCache(cacheKey, LIST_CACHE_TTL, async () => {
    //         const candidates = await this.repo.findActiveBookRows({
    //             languageId: lang.id,
    //             q,
    //             categoryId,
    //         });

    //         const total = candidates.length;
    //         if (!total) {
    //             return { page, limit, total: 0, totalPages: 0, items: [] };
    //         }

    //         const candidateIds = candidates.map((r) => r.id);
    //         const createdAtMap = new Map<string, Date>(candidates.map((r) => [r.id.toString(), r.createdAt]));

    //         const sortedIds = await this.sortBookIds({
    //             sort,
    //             candidateIds,
    //             createdAtMap,
    //             languageId: lang.id,
    //         });

    //         const offset = (page - 1) * limit;
    //         const pageIds = sortedIds.slice(offset, offset + limit);

    //         const [books, ratingRows, salesRows] = await Promise.all([
    //             this.repo.findBooksByIds(pageIds, lang.id),
    //             this.repo.groupBookRatings(pageIds),
    //             this.repo.groupBookSales(pageIds),
    //         ]);

    //         const ratingMap = this.buildRatingMap(ratingRows);
    //         const salesMap = this.buildSalesMap(salesRows);

    //         const cardMap = this.buildCardMapFromBooks(books, salesMap, ratingMap);

    //         return {
    //             page,
    //             limit,
    //             total,
    //             totalPages: Math.ceil(total / limit),
    //             items: this.pickCards(pageIds, cardMap),
    //         };
    //     });
    // }
    // service
    async getBookDetail(bookId: bigint, lang?: string): Promise<CatalogBookDetailDto> {
        const language = await this.resolveLanguage(lang);
        const cacheKey = `catalog:detail:${bookId.toString()}:${language.code}`;

        return this.withCache(cacheKey, DETAIL_CACHE_TTL, async () => {
            const book = await this.repo.findBookDetailById(bookId, language.id);
            if (!book) throw new NotFoundException("Book not found");

            const t = book.translations[0];
            const priceRange = this.getVariantPriceRange(book.variants);

            const categories: CatalogCategoryDto[] = (book.categories ?? []).map((x) => {
                const c = x.category;
                const ct = c.categoryTranslation?.[0];
                return {
                    id: c.id.toString(),
                    parentId: c.parentId ? c.parentId.toString() : null,
                    sortOrder: c.sortOrder ?? null,
                    name: ct?.name ?? null,
                    slug: ct?.slug ?? null,
                };
            });

            const variants: CatalogBookVariantDto[] = (book.variants ?? []).map((v) => ({
                id: v.id.toString(),
                format: v.format,
                edition: v.edition ?? null,
                isbn: v.isbn ?? null,
                price: v.price?.toString?.() ?? String(v.price),
                currencyCode: v.currencyCode ?? null,
                stock: v.stock ?? null,
            }));

            return {
                id: book.id.toString(),
                title: t?.title ?? `Book ${book.id.toString()}`,
                slug: t?.slug ?? null,
                description: t?.description ?? null,
                coverImageUrl: book.coverImageUrl ?? null,
                publicationYear: book.publicationYear ?? null,
                pageCount: book.pageCount ?? null,
                weightGrams: book.weightGrams ?? null,
                publisherName: book.publisher?.defaultName ?? null,
                minPrice: priceRange.minPrice,
                maxPrice: priceRange.maxPrice,
                currencyCode: priceRange.currencyCode,
                ratingAvg: book.ratingAvg,
                ratingCount: book.ratingCount,
                variants,
                categories,
                createdAt: book.createdAt,
            };
        });
    }


    private async withCache<T>(
        key: string,
        ttl: number,
        factory: () => Promise<T>,
    ): Promise<T> {
        const cached = await this.cache.get<T>(key);
        if (cached) return cached;

        const value = await factory();
        await this.cache.set(key, value, ttl);
        return value;
    }

    private pickCards(
        ids: bigint[],
        map: Map<string, CatalogBookCardDto>,
    ): CatalogBookCardDto[] {
        return ids
            .map((id) => map.get(id.toString()))
            .filter((x) => x != undefined && x != null);
    }

    private toBookCard(
        book: Awaited<ReturnType<CatalogRepository['findBooksByIds']>>[number],
        soldCount?: number,
        ratingAvg?: number,
        ratingCount?: number,
    ): CatalogBookCardDto {
        const t = book.translations[0];
        // const variant = this.getVariantPriceRange(variant);
        return {
            id: book.id.toString(),
            title: t?.title ?? `Book ${book.id.toString()}`,
            slug: t?.slug ?? null,
            coverImageUrl: book.coverImageUrl,
            ratingAvg: ratingAvg ?? null,
            ratingCount: ratingCount ?? 0,
            soldCount: soldCount ?? 0,
            createdAt: book.createdAt,
        };
    }

    private toVariantBookCard(
        variant: Awaited<
            ReturnType<CatalogRepository['findBooksVariantByIds']>
        >[number],
        soldCount?: number,
        ratingAvg?: number,
        ratingCount?: number,
    ): CatalogBookCardDto {
        const book = variant.book;
        const t = book.translations[0];
        const priceRange = this.getVariantPriceRange([
            { price: variant.price, currencyCode: variant.currencyCode },
        ]);

        return {
            id: book.id.toString(),
            title: t?.title ?? `Book ${book.id.toString()}`,
            slug: t?.slug ?? null,
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
        variants: Array<{ price: any; currencyCode: string | null }>,
    ) {
        if (!variants.length)
            return { minPrice: null, maxPrice: null, currencyCode: null };

        const prices = variants.map((v) => Number(v.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const currencyCode =
            variants.find((v) => !!v.currencyCode)?.currencyCode ?? null;

        return {
            minPrice: Number.isFinite(minPrice) ? minPrice.toFixed(2) : null,
            maxPrice: Number.isFinite(maxPrice) ? maxPrice.toFixed(2) : null,
            currencyCode,
        };
    }

    // Build unique mục đính trùng lọc trùng id tối ưu query nhanh
    private uniqueBigIntIds(ids: bigint[]): bigint[] {
        return [...new Map(ids.map((id) => [id.toString(), id])).values()];
    }

    private parseBigInt(value?: string): bigint | undefined {
        if (!value) return undefined;
        try {
            return BigInt(value);
        } catch {
            return undefined;
        }
    }

    private async resolveLanguage(
        lang?: string,
    ): Promise<{ id: number; code: string }> {
        const normalized = (lang ?? 'vi').trim().toLowerCase();
        const cacheKey = `catalog:lang:${normalized}`;

        // GET cached xem ngôn ngữ đó đã cached chưa, tránh gọi db
        const cached = await this.cache.get<{ id: number; code: string }>(cacheKey);
        if (cached) return cached;

        // Tìm trong bảng có ngôn ngữ này chưa
        const found = await this.repo.findLanguageByCode(normalized);
        if (found) {
            await this.cache.set(cacheKey, found, CATEGORY_CACHE_TTL);
            return found;
        }

        // Trả về ngôn ngữ đầu tiên active
        const fallback = await this.repo.findDefaultLanguage();
        if (!fallback) throw new NotFoundException('No active language found');

        await this.cache.set(cacheKey, fallback, CATEGORY_CACHE_TTL);
        return fallback;
    }
}
