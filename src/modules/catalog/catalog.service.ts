import { CatalogBookListQueryDto, CatalogHomeQueryDto } from '@/modules/catalog/dto/request';
import {
    CatalogBookCardDto,
    CatalogBookDetailDto,
    CatalogBookListResponseDto,
    CatalogBookSpecDto,
    CatalogBookVariantDto,
    CatalogCategoryDto,
    CatalogCategoryTreeDto,
} from '@/modules/catalog/dto/response';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Badge } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { CatalogRepository } from './catalog.repository';

const HOME_CACHE_TTL = 60_000;
const LIST_CACHE_TTL = 45_000;
const DETAIL_CACHE_TTL = 120_000;
const CATEGORY_CACHE_TTL = 60_000;


type CategoryRow = Awaited<
    ReturnType<CatalogRepository['findActiveCategoriesByLanguage']>
>[number];
type BookDetailByIdRow = NonNullable<
    Awaited<ReturnType<CatalogRepository['findBookDetailById']>>
>;
type BookDetailBySlugRow = NonNullable<
    Awaited<ReturnType<CatalogRepository['findBookDetailBySlug']>>
>;
type BookDetailRow = BookDetailByIdRow | BookDetailBySlugRow;

@Injectable()
export class CatalogService {
    constructor(
        private readonly repo: CatalogRepository,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) { }

    // Lấy giớ hạn không lấy phân trang
    async getCatalogHome(query: CatalogHomeQueryDto): Promise<any> {
        const limit = query.limit ?? 12;
        const lang = await this.resolveLanguage(query.lang);
        const cacheKey = `catalog:home:${lang.code}:${limit}`;

        return this.withCache(cacheKey, HOME_CACHE_TTL, async () => {
            const [newestRows, saleTopLimit] = await Promise.all([
                this.repo.findNewestActiveBookIds(lang.id, limit),
                this.repo.groupBookSales(limit),
            ]);

            const newestIds = newestRows.map((r) => r.id);
            const bestSellerIdsVariant = saleTopLimit.map((r) =>
                BigInt(r.bookVariantId),
            );

            const allUniqueIds = this.uniqueBigIntIds([
                ...bestSellerIdsVariant,
                ...newestIds
            ]);

            const cardMap = await this.buildCardMap(
                allUniqueIds,
                lang.id,
            );

            return {
                newAndTrending: this.pickCards(allUniqueIds, cardMap),
            };
        });
    }

    async getCategories(lang?: string): Promise<CatalogCategoryTreeDto[]> {
        const language = await this.resolveCategoryLanguage(lang);
        const cacheKey = `catalog:categories:${language.code}`;

        return this.withCache(cacheKey, CATEGORY_CACHE_TTL, async () => {
            const rows = await this.repo.findActiveCategoriesByLanguage(language.id);
            return this.buildCategoryTree(rows);
        });
    }

    async getBookCardsByVariantIds(
        variantIds: string[],
        lang?: string,
    ): Promise<Map<string, CatalogBookCardDto>> {
        const parsedIds = variantIds
            .map((id) => this.parseBigInt(id))
            .filter((id): id is bigint => id != undefined);

        if (!parsedIds.length) {
            return new Map<string, CatalogBookCardDto>();
        }

        const language = await this.resolveLanguage(lang);
        return this.buildCardVariantMap(parsedIds, language.id);
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
        const variants = await this.repo.findBooksVariantByIds(ids, languageId, ids.length);
        return new Map<string, CatalogBookCardDto>(
            variants.map((variant): [string, CatalogBookCardDto] => [
                variant.id.toString(),
                this.toVariantBookCard(variant),
            ]),
        );
    }

    private buildCategoryTree(rows: CategoryRow[]): CatalogCategoryTreeDto[] {
        const nodes = new Map<string, CatalogCategoryTreeDto>();

        for (const row of rows) {
            const translation = row.categoryTranslation?.[0];
            if (!translation?.name) continue;

            const id = row.id.toString();
            nodes.set(id, {
                id,
                parentId: row.parentId ? row.parentId.toString() : null,
                name: translation.name,
                slug: translation.slug ?? null,
                sortOrder: row.sortOrder ?? 0,
                children: [],
            });
        }

        const roots: CatalogCategoryTreeDto[] = [];
        for (const node of nodes.values()) {
            if (!node.parentId) {
                roots.push(node);
                continue;
            }

            const parent = nodes.get(node.parentId);
            if (!parent) continue;
            parent.children.push(node);
        }

        this.sortCategoryTree(roots);
        return roots;
    }

    private sortCategoryTree(nodes: CatalogCategoryTreeDto[]): void {
        nodes.sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            return a.id.localeCompare(b.id);
        });

        for (const node of nodes) {
            this.sortCategoryTree(node.children);
        }
    }

    async listBooks(query: CatalogBookListQueryDto): Promise<CatalogBookListResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const language = await this.resolveCategoryLanguage(query.lang);

        const cacheKey = `catalog:books:lang=${language.code}:p${page}:l${limit}`;

        return this.withCache(cacheKey, LIST_CACHE_TTL, async () => {
            const [total, rows] = await Promise.all([
                this.repo.countBooksForList(language.id),
                this.repo.findBooksForList(language.id, page, limit),
            ]);

            const items: CatalogBookCardDto[] = rows.map((book) => {
                const translation = book.translations[0];
                const cheapestVariant = book.variants[0];
                const stock = cheapestVariant?.stock ?? 0;

                return {
                    id: book.id.toString(),
                    title: translation?.title ?? `Book ${book.id.toString()}`,
                    slug: translation?.slug ?? null,
                    coverImageUrl: book.coverImageUrl ?? null,
                    price: cheapestVariant ? Number(cheapestVariant.price).toFixed(2) : null,
                    currencyCode: cheapestVariant?.currencyCode ?? null,
                    isOutOfStock: !cheapestVariant || stock <= 0,
                    createdAt: book.createdAt,
                    bookVariantId: cheapestVariant.id,
                    format: cheapestVariant.format
                };
            });

            return {
                page,
                limit,
                total,
                totalPages: total ? Math.ceil(total / limit) : 0,
                items,
            };
        });
    }

    async queryListBook(query: CatalogBookListQueryDto, ids: bigint[]): Promise<CatalogBookListResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const language = await this.resolveCategoryLanguage(query.lang);

        const [total, rows] = await Promise.all([
            this.repo.countBooksForList(language.id),
            this.repo.findBooksByIds(ids, language.id, page, limit),
        ]);

        const items: CatalogBookCardDto[] = rows.map((book) => {
            const translation = book.translations[0];
            const cheapestVariant = book.variants[0];
            const stock = cheapestVariant?.stock ?? 0;

            return {
                id: book.id.toString(),
                title: translation?.title ?? `Book ${book.id.toString()}`,
                slug: translation?.slug ?? null,
                coverImageUrl: book.coverImageUrl ?? null,
                price: cheapestVariant ? Number(cheapestVariant.price).toFixed(2) : null,
                currencyCode: cheapestVariant?.currencyCode ?? null,
                isOutOfStock: !cheapestVariant || stock <= 0,
                createdAt: book.createdAt,
                bookVariantId: cheapestVariant.id,
            };
        });

        return {
            page,
            limit,
            total,
            totalPages: total ? Math.ceil(total / limit) : 0,
            items,
        };
    }


    async getBookDetail(bookId: bigint, lang?: string): Promise<CatalogBookDetailDto> {
        const language = await this.resolveLanguage(lang);
        const cacheKey = `catalog:detail:${bookId.toString()}:${language.code}`;

        return this.withCache(cacheKey, DETAIL_CACHE_TTL, async () => {
            const book = await this.repo.findBookDetailById(bookId, language.id);
            if (!book) throw new NotFoundException('Book not found');
            return this.toBookDetail(book);
        });
    }

    async getBookDetailBySlug(slug: string, lang?: string): Promise<CatalogBookDetailDto> {
        const language = await this.resolveLanguage(lang);
        const normalizedSlug = slug?.trim();
        if (!normalizedSlug) {
            throw new BadRequestException('slug is required');
        }

        const cacheKey = `catalog:detail:slug:${normalizedSlug}:${language.code}`;

        return this.withCache(cacheKey, DETAIL_CACHE_TTL, async () => {
            const book = await this.repo.findBookDetailBySlug(normalizedSlug, language.id);
            if (!book) throw new NotFoundException('Book not found');
            return this.toBookDetail(book, normalizedSlug);
        });
    }

    private toBookDetail(book: BookDetailRow, slugFallback?: string): CatalogBookDetailDto {
        const t = book.translations[0];

        return {
            id: book.id.toString(),
            title: t?.title ?? `Book ${book.id.toString()}`,
            slug: t?.slug ?? slugFallback ?? null,
            description: t?.description ?? null,
            coverImageUrl: book.coverImageUrl ?? null,
            publicationYear: book.publicationYear ?? null,
            pageCount: book.pageCount ?? null,
            weightGrams: book.weightGrams ?? null,
            publisherName: book.publisher?.defaultName ?? null,
            ratingAvg: book.ratingAvg,
            ratingCount: book.ratingCount,
            variants: this.toBookVariants(book),
            categories: this.toBookCategories(book),
            specs: this.toBookSpecs(book),
            badges: this.toBookBadges(book),
            createdAt: book.createdAt,
        };
    }

    private toBookCategories(book: BookDetailRow): CatalogCategoryDto[] {
        return (book.categories ?? []).map((x) => {
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
    }

    private toBookVariants(book: BookDetailRow): CatalogBookVariantDto[] {
        return (book.variants ?? []).map((v) => ({
            id: v.id.toString(),
            format: v.format,
            edition: v.edition ?? null,
            isbn: v.isbn ?? null,
            price: v.price?.toString?.() ?? String(v.price),
            currencyCode: v.currencyCode ?? null,
            stock: v.stock ?? null,
        }));
    }

    private toBookSpecs(book: BookDetailRow): CatalogBookSpecDto {
        const specs = book.specs;
        if (!specs) {
            return {};
        }

        return {
            widthCm: this.toNullableString(specs.widthCm),
            heightCm: this.toNullableString(specs.heightCm),
            thicknessCm: this.toNullableString(specs.thicknessCm),
            packaging: specs.packaging ?? null,
        };
    }

    private toBookBadges(book: BookDetailRow): Badge[] {
        return (book.bookBadge ?? []).map((badge) => badge.code);
    }

    private toNullableString(value: { toString: () => string } | null | undefined): string | null {
        if (!value) {
            return null;
        }
        return value.toString();
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
        const cheapestVariant = book.variants[0];
        return {
            id: book.id.toString(),
            title: t?.title ?? `Book ${book.id.toString()}`,
            slug: t?.slug ?? null,
            coverImageUrl: book.coverImageUrl,
            ratingAvg: ratingAvg ?? null,
            ratingCount: ratingCount ?? 0,
            soldCount: soldCount ?? 0,
            createdAt: book.createdAt,
            badges: (book.bookBadge ?? []).map((badge) => badge.code),
            bookVariantId: cheapestVariant?.id,
            price: cheapestVariant
                ? Number(cheapestVariant.price).toFixed(2)
                : null,
            currencyCode: cheapestVariant?.currencyCode ?? null,
            format: cheapestVariant?.format ?? null,
            isOutOfStock: !cheapestVariant || (cheapestVariant.stock ?? 0) <= 0,
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
        const price = Number.isFinite(Number(variant.price))
            ? Number(variant.price).toFixed(2)
            : null;

        return {
            id: book.id.toString(),
            title: t?.title ?? `Book ${book.id.toString()}`,
            slug: t?.slug ?? null,
            coverImageUrl: book.coverImageUrl,
            price: price,
            currencyCode: variant.currencyCode ?? null,
            ratingAvg: ratingAvg ?? null,
            ratingCount: ratingCount ?? 0,
            soldCount: soldCount ?? 0,
            createdAt: book.createdAt,
            badges: (book.bookBadge ?? []).map((badge) => badge.code),
            bookVariantId: variant.id,
            format: variant.format,
            isOutOfStock: (variant.stock ?? 0) <= 0,
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

    private async resolveCategoryLanguage(
        lang?: string,
    ): Promise<{ id: number; code: string }> {
        const normalized = (lang ?? 'en').trim().toLowerCase();
        if (normalized !== 'vi' && normalized !== 'en') {
            throw new BadRequestException('lang must be one of: vi, en');
        }

        const cacheKey = `catalog:lang:${normalized}`;
        const cached = await this.cache.get<{ id: number; code: string }>(cacheKey);
        if (cached) return cached;

        const found = await this.repo.findLanguageByCode(normalized);
        if (!found) {
            throw new NotFoundException(`Language "${normalized}" is not active`);
        }

        await this.cache.set(cacheKey, found, CATEGORY_CACHE_TTL);
        return found;
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
