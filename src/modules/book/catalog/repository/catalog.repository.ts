import { PrismaService } from '@/database';
import {
    SearchFilterSortType,
    SearchPriceType,
} from '@/modules/book/catalog/dto/request/catalog-book-list.query.dto';
import { CatalogBookCardDto } from '@/modules/book/catalog/dto/response';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type BookFilterParams = {
    languageId: number;
    q?: string;
    categoryId?: number;
};

export type PriceRangeFilter = { gt?: number; lte?: number };

export type CatalogSortDirective = {
    field: 'title' | 'price';
    direction: 'asc' | 'desc';
};

export type BookListFilterParams = {
    languageId: number;
    categoryId?: number;
    priceWhere?: PriceRangeFilter | null;
};

type FindBooksForListParams = {
    languageId: number;
    page: number;
    limit: number;
    keyword?: string;
    categoryId?: number;
    priceWhere?: PriceRangeFilter | null;
};

export type CatalogKeywordSearchMode = 'fulltext' | 'like';

export type CatalogKeywordSearch = {
    keyword: string;
    mode: CatalogKeywordSearchMode;
};

@Injectable()
export class CatalogRepository {
    constructor(private readonly prisma: PrismaService) { }

    findActiveCategoriesByLanguage(languageId: number) {
        return this.prisma.category.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                categoryTranslation: {
                    some: { languageId },
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                parentId: true,
                sortOrder: true,
                categoryTranslation: {
                    where: { languageId },
                    select: {
                        name: true,
                        slug: true,
                    },
                },
            },
        });
    }

    findCategoryBySlug(slug: string, languageId: number) {
        return this.prisma.category.findFirst({
            where: {
                isActive: true,
                deletedAt: null,
                categoryTranslation: {
                    some: {
                        languageId,
                        slug,
                    },
                },
            },
            select: {
                id: true,
            },
        });
    }

    countBooksForList(languageId: number, priceWhere?: PriceRangeFilter | null) {
        return this.prisma.book.count({
            where: this.buildBookListWhere({ languageId, priceWhere }),
        });
    }

    countBooksForListByCategory(
        categoryId: number,
        languageId: number,
        priceWhere?: PriceRangeFilter | null,
    ) {
        return this.prisma.book.count({
            where: this.buildBookListWhere({ languageId, categoryId, priceWhere }),
        });
    }

    findBooksForList(
        languageId: number,
        page: number,
        limit: number,
        priceWhere?: PriceRangeFilter | null,
    ) {
        return this.findBooksForListByFilter({
            languageId,
            page,
            limit,
            priceWhere,
        });
    }

    findBooksForListByCategory(
        categoryId: number,
        languageId: number,
        page: number,
        limit: number,
        priceWhere?: PriceRangeFilter | null,
    ) {
        return this.findBooksForListByFilter({
            languageId,
            categoryId,
            page,
            limit,
            priceWhere,
        });
    }

    findActiveBookRows(filter: BookFilterParams) {
        return this.prisma.book.findMany({
            where: this.buildBookWhere(filter),
            select: {
                id: true,
                createdAt: true,
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        });
    }

    findBookVariantById(bookVariantId: number, languageId: number) {
        return this.prisma.bookVariant.findFirst({
            where: {
                id: bookVariantId,
                isActive: true,
                price: { gt: 0 },
                book: {
                    isActive: true,
                    deletedAt: null,
                    variants: {
                        some: {
                            isActive: true,
                            price: {
                                gt: 0,
                            },
                        },
                    },
                },
            },
            select: {
                id: true,
                price: true,
                currencyCode: true,
                stock: true,
                format: true,
                bookId: true,
                book: {
                    select: {
                        id: true,
                        coverImageUrl: true,
                        translations: {
                            where: { languageId },
                            select: {
                                title: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });
    }

    findBookVariantByIds(bookVariantId: number[]) {
        return this.prisma.bookVariant.findMany({
            where: {
                id: { in: bookVariantId },
                isActive: true,
                price: { gt: 0 },
                book: {
                    isActive: true,
                    deletedAt: null,
                    variants: {
                        some: {
                            isActive: true,
                            price: {
                                gt: 0,
                            },
                        },
                    },
                },
            },
            select: {
                id: true,
                price: true,
                currencyCode: true,
                stock: true,
                format: true,
                bookId: true,
                reserved: true,
                isbn: true,
                book: {
                    select: {
                        id: true,
                        coverImageUrl: true,
                        translations: {
                            select: {
                                slug: true,
                            },
                        },
                    },
                },
            },
        });
    }

    findCatalogHomeBooks(languageId: number, take: number) {
        return this.prisma.book.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                translations: {
                    some: {
                        languageId,
                    },
                },
                variants: {
                    some: {
                        isActive: true,
                        price: {
                            gt: 0,
                        },
                    },
                },
            },
            select: {
                id: true,
                coverImageUrl: true,
                createdAt: true,
                translations: {
                    where: { languageId },
                    select: {
                        title: true,
                        slug: true,
                        description: true,
                    },
                },
                bookBadge: {
                    orderBy: [{ id: 'asc' }],
                    select: {
                        code: true,
                    },
                },
                variants: {
                    where: { isActive: true, price: { gt: 0 } },
                    orderBy: [{ price: 'asc' }, { id: 'asc' }],
                    take: 1,
                    select: {
                        id: true,
                        price: true,
                        currencyCode: true,
                        stock: true,
                        format: true,
                    },
                },
            },
            take,
        });
    }

    findBooksByIds(
        bookIds: number[],
        languageId: number,
        page = 1,
        limit = 20,
        priceWhere?: PriceRangeFilter | null,
    ) {
        if (!bookIds.length) {
            return Promise.resolve([]);
        }

        return this.prisma.book.findMany({
            skip: (page - 1) * limit,
            take: limit,
            where: {
                id: { in: bookIds },
                isActive: true,
                deletedAt: null,
                variants: {
                    some: {
                        isActive: true,
                        price: {
                            ...(priceWhere ? priceWhere : { gt: 0 })
                        },
                    },
                },
            },
            select: {
                id: true,
                coverImageUrl: true,
                publicationYear: true,
                pageCount: true,
                weightGrams: true,
                createdAt: true,
                publisher: {
                    select: {
                        defaultName: true,
                    },
                },
                specs: true,
                bookBadge: {
                    orderBy: [{ id: 'asc' }],
                    select: {
                        code: true
                    }
                },
                translations: {
                    where: { languageId },
                    select: {
                        title: true,
                        slug: true,
                        description: true,
                    },
                },
                categories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                parentId: true,
                                sortOrder: true,
                                categoryTranslation: {
                                    where: { languageId },
                                    select: {
                                        name: true,
                                        slug: true,
                                    },
                                },
                            },
                        },
                    },
                },
                variants: {
                    where: { isActive: true, price: { gt: 0 } },
                    orderBy: {
                        price: 'desc'
                    },
                    select: {
                        id: true,
                        format: true,
                        edition: true,
                        isbn: true,
                        price: true,
                        currencyCode: true,
                        stock: true,
                    },
                    take: 1
                },
            },
        });
    }

    async findBooksVariantByIds(
        bookVariantId: number[],
        languageId: number,
        take: number = 20,
    ): Promise<CatalogBookCardDto[]> {
        if (!bookVariantId.length) {
            return Promise.resolve([]);
        }

        const variants = await this.prisma.bookVariant.findMany({
            where: {
                id: { in: bookVariantId },
                isActive: true,
                price: { gt: 0 },
                book: {
                    isActive: true,
                    deletedAt: null,
                    variants: {
                        some: {
                            isActive: true,
                            price: {
                                gt: 0,
                            },
                        },
                    },
                },
            },
            select: {
                book: {
                    select: {
                        id: true,
                        coverImageUrl: true,
                        publicationYear: true,
                        pageCount: true,
                        weightGrams: true,
                        createdAt: true,
                        publisher: {
                            select: {
                                defaultName: true,
                            },
                        },
                        translations: {
                            where: { languageId },
                            select: {
                                title: true,
                                slug: true,
                                description: true,
                            },
                        },
                        bookBadge: {
                            select: {
                                code: true
                            }
                        },
                        categories: {
                            select: {
                                category: {
                                    select: {
                                        id: true,
                                        parentId: true,
                                        sortOrder: true,
                                        categoryTranslation: {
                                            where: { languageId },
                                            select: {
                                                name: true,
                                                slug: true,
                                            },
                                        },
                                    },
                                },
                            },
                        }
                    },
                },
                id: true,
                format: true,
                edition: true,
                isbn: true,
                price: true,
                currencyCode: true,
                stock: true,
            },
            take
        });

        return variants.map((variant) => {
            const book = variant.book;
            const [translation] = book.translations;
            const price = Number.isFinite(Number(variant.price))
                ? Number(variant.price).toFixed(2)
                : null;

            return {
                id: book.id,
                title: translation?.title ?? `Book ${book.id}`,
                slug: translation?.slug ?? null,
                coverImageUrl: book.coverImageUrl,
                price,
                currencyCode: variant.currencyCode ?? null,
                soldCount: 0,
                createdAt: book.createdAt,
                badges: (book.bookBadge ?? []).map((badge) => badge.code),
                bookVariantId: variant.id,
                format: variant.format,
                isOutOfStock: (variant.stock ?? 0) <= 0,
            };
        });
    }

    findActiveBookVariantsForSearchIndex() {
        return this.prisma.bookVariant.findMany({
            where: {
                isActive: true,
                price: { gt: 0 },
                book: {
                    isActive: true,
                    deletedAt: null,
                    variants: {
                        some: {
                            isActive: true,
                            price: {
                                gt: 0,
                            },
                        },
                    },
                },
            },
            orderBy: [{ id: 'asc' }],
            select: {
                id: true,
                bookId: true,
                format: true,
                price: true,
                currencyCode: true,
                book: {
                    select: {
                        id: true,
                        publisher: {
                            select: {
                                defaultName: true,
                            },
                        },
                        translations: {
                            select: {
                                title: true,
                                description: true,
                                language: {
                                    select: {
                                        code: true,
                                    },
                                },
                            },
                        },
                        categories: {
                            select: {
                                categoryId: true,
                                category: {
                                    select: {
                                        categoryTranslation: {
                                            select: {
                                                name: true,
                                                language: {
                                                    select: {
                                                        code: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    findActiveBookFirstVariant() {
        return this.prisma.book.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                variants: {
                    some: {
                        isActive: true,
                        price: {
                            gt: 0,
                        },
                    },
                },
            },
            orderBy: { id: 'asc' },
            select: {
                id: true,
                translations: {
                    select: {
                        title: true,
                        slug: true,
                        description: true,
                        language: {
                            select: {
                                code: true
                            }
                        }
                    },
                },
                variants: {
                    where: { isActive: true, price: { gt: 0 } },
                    orderBy: { price: 'asc' },
                    take: 1,
                    select: {
                        id: true,
                        price: true,
                        currencyCode: true,
                    },
                },
                categories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                categoryTranslation: {
                                    select: {
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });
    }

    // repo
    async findBookDetailById(bookId: number, languageId: number) {
        const [bookDetail,] = await Promise.all([
            this.prisma.book.findFirst({
                where: {
                    id: bookId,
                    isActive: true,
                    deletedAt: null,
                    variants: {
                        some: {
                            isActive: true,
                            price: {
                                gt: 0,
                            },
                        },
                    },
                },
                select: {
                    id: true,
                    coverImageUrl: true,
                    publicationYear: true,
                    pageCount: true,
                    weightGrams: true,
                    createdAt: true,
                    publisher: { select: { defaultName: true } },
                    specs: {
                        select: {
                            widthCm: true,
                            heightCm: true,
                            thicknessCm: true,
                            packaging: true,
                        },
                    },
                    bookBadge: {
                        orderBy: [{ id: 'asc' }],
                        select: {
                            code: true,
                        },
                    },
                    translations: {
                        where: { languageId },
                        select: { title: true, slug: true, description: true },
                    },
                    categories: {
                        select: {
                            category: {
                                select: {
                                    id: true,
                                    parentId: true,
                                    sortOrder: true,
                                    categoryTranslation: {
                                        where: { languageId },
                                        select: { name: true, slug: true },
                                    },
                                },
                            },
                        },
                    },
                    variants: {
                        where: { isActive: true, price: { gt: 0 } },
                        orderBy: [{ price: "asc" }, { id: "asc" }],
                        select: {
                            id: true,
                            format: true,
                            edition: true,
                            isbn: true,
                            price: true,
                            currencyCode: true,
                            available: true,
                        },
                    },
                },
            }),

        ]);

        if (!bookDetail) return null;


        return {
            ...bookDetail,
        };
    }

    async findBookDetailBySlug(slug: string, languageId: number) {
        const bookDetail = await this.prisma.book.findFirst({
            where: {
                isActive: true,
                deletedAt: null,
                variants: {
                    some: {
                        isActive: true,
                        price: {
                            gt: 0,
                        },
                    },
                },
                translations: {
                    some: {
                        languageId,
                        slug,
                    },
                },
            },
            select: {
                id: true,
                coverImageUrl: true,
                publicationYear: true,
                pageCount: true,
                weightGrams: true,
                createdAt: true,
                publisher: { select: { defaultName: true } },
                specs: {
                    select: {
                        widthCm: true,
                        heightCm: true,
                        thicknessCm: true,
                        packaging: true,
                    },
                },
                bookBadge: {
                    orderBy: [{ id: 'asc' }],
                    select: {
                        code: true,
                    },
                },
                translations: {
                    where: { languageId, slug },
                    select: { title: true, slug: true, description: true },
                },
                categories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                parentId: true,
                                sortOrder: true,
                                categoryTranslation: {
                                    where: { languageId },
                                    select: { name: true, slug: true },
                                },
                            },
                        },
                    },
                },
                variants: {
                    where: { isActive: true, price: { gt: 0 } },
                    orderBy: [{ price: 'asc' }, { id: 'asc' }],
                    select: {
                        id: true,
                        format: true,
                        edition: true,
                        isbn: true,
                        price: true,
                        currencyCode: true,
                        available: true,
                    },
                },
            },
        });

        if (!bookDetail) return null;

        return {
            ...bookDetail,
        };
    }
    async findBookAlikeCategory(bookId: number, categoriesIds: number[]) {
        return this.prisma.book.findMany({
            where: {
                id: { not: bookId },
                isActive: true,
                deletedAt: null,
                variants: {
                    some: {
                        isActive: true,
                        price: {
                            gt: 0,
                        },
                    },
                },
                categories: {
                    some: {
                        categoryId: {
                            in: categoriesIds
                        }
                    }
                }
            },
            select: {
                id: true,
                categories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            }
        })
    }

    async findBookIncludeCategory(
        categoryId: number,
        languageId: number,
        search: CatalogKeywordSearch,
        page: number,
        limit: number,
    ): Promise<number[]> {
        const offset = (page - 1) * limit;
        const keywordCondition = this.buildBookTranslationKeywordCondition(search);
        const scoreSelect = this.buildBookTranslationScoreSelect(search);
        const rows = await this.prisma.$queryRaw<{ id: number | bigint }[]>(Prisma.sql`
            SELECT
                b.id,
                ${scoreSelect}
            FROM books b
            JOIN book_translations bt
                ON bt.book_id = b.id
                AND bt.language_id = ${languageId}
            JOIN book_categories bc
                ON bc.book_id = b.id
                AND bc.category_id = ${categoryId}
            WHERE b.is_active = 1
                AND b.deleted_at IS NULL
                AND ${this.buildPublicBookPriceVisibilitySql()}
                AND ${keywordCondition}
            ORDER BY score DESC, b.created_at DESC, b.id DESC
            LIMIT ${Prisma.sql`${limit}`}
            OFFSET ${Prisma.sql`${offset}`}
        `);
        return rows.map((r) => Number(r.id));
    }

    async countBookIncludeCategory(
        categoryId: number,
        languageId: number,
        search: CatalogKeywordSearch,
    ): Promise<number> {
        const keywordCondition = this.buildBookTranslationKeywordCondition(search);
        const rows = await this.prisma.$queryRaw<{ total: number | bigint }[]>(Prisma.sql`
            SELECT COUNT(DISTINCT b.id) AS total
            FROM books b
            JOIN book_translations bt
                ON bt.book_id = b.id
                AND bt.language_id = ${languageId}
            JOIN book_categories bc
                ON bc.book_id = b.id
                AND bc.category_id = ${categoryId}
            WHERE b.is_active = 1
                AND b.deleted_at IS NULL
                AND ${this.buildPublicBookPriceVisibilitySql()}
                AND ${keywordCondition}
        `);
        return Number(rows[0]?.total ?? 0);
    }

    async findBookNeIncludeCategory(
        languageId: number,
        search: CatalogKeywordSearch,
        page: number,
        limit: number,
    ): Promise<number[]> {
        const offset = (page - 1) * limit;
        const keywordCondition = this.buildBookTranslationKeywordCondition(search);
        const scoreSelect = this.buildBookTranslationScoreSelect(search);
        const rows = await this.prisma.$queryRaw<{ id: number | bigint }[]>(Prisma.sql`
            SELECT
                b.id,
                ${scoreSelect}
            FROM books b
            JOIN book_translations bt
                ON bt.book_id = b.id
                AND bt.language_id = ${languageId}
            WHERE b.is_active = 1
                AND b.deleted_at IS NULL
                AND ${this.buildPublicBookPriceVisibilitySql()}
                AND ${keywordCondition}
            ORDER BY score DESC, b.created_at DESC, b.id DESC
            LIMIT ${Prisma.sql`${limit}`}
            OFFSET ${Prisma.sql`${offset}`}
        `);
        return rows.map((r) => Number(r.id));
    }

    async countBookNeIncludeCategory(
        languageId: number,
        search: CatalogKeywordSearch,
    ): Promise<number> {
        const keywordCondition = this.buildBookTranslationKeywordCondition(search);
        const rows = await this.prisma.$queryRaw<{ total: number | bigint }[]>(Prisma.sql`
            SELECT COUNT(DISTINCT b.id) AS total
            FROM books b
            JOIN book_translations bt
                ON bt.book_id = b.id
                AND bt.language_id = ${languageId}
            WHERE b.is_active = 1
                AND b.deleted_at IS NULL
                AND ${this.buildPublicBookPriceVisibilitySql()}
                AND ${keywordCondition}
        `);
        return Number(rows[0]?.total ?? 0);
    }

    findBooksQueryRaw(
        languageId: number,
        page: number,
        limit: number,
        priceWhere?: PriceRangeFilter | null,
    ) {
        return this.findBooksForListByFilter({ languageId, page, limit, priceWhere });
    }

    countBookQueryRaw(languageId: number, priceWhere?: PriceRangeFilter | null) {
        return this.countBooksForList(languageId, priceWhere);
    }
    private findBooksForListByFilter(params: FindBooksForListParams) {
        const { languageId, categoryId, page, limit, priceWhere } = params;

        return this.prisma.book.findMany({
            where: this.buildBookListWhere({ languageId, categoryId, priceWhere }),
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                coverImageUrl: true,
                createdAt: true,
                translations: {
                    where: { languageId },
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    },
                },
                bookBadge: {
                    select: {
                        code: true,
                    },
                },
                categories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                parentId: true,
                                sortOrder: true,
                                categoryTranslation: {
                                    where: { languageId },
                                    select: {
                                        name: true,
                                        slug: true,
                                    },
                                },
                            },
                        },
                    },
                },
                variants: {
                    where: { isActive: true, price: { gt: 0 } },
                    orderBy: [{ price: 'asc' }, { id: 'asc' }],
                    take: 1,
                    select: {
                        id: true,
                        price: true,
                        currencyCode: true,
                        stock: true,
                        format: true,
                    },
                },
            },
        });
    }


    private buildBookWhere(filter: BookFilterParams): Prisma.BookWhereInput {
        return {
            isActive: true,
            deletedAt: null,
            variants: {
                some: {
                    isActive: true,
                    price: {
                        gt: 0,
                    },
                },
            },
            ...(filter.q
                ? {
                    translations: {
                        some: {
                            languageId: filter.languageId,
                            title: {
                                contains: filter.q,
                            },
                        },
                    },
                }
                : {
                    translations: {
                        some: {
                            languageId: filter.languageId,
                        },
                    },
                }),
            ...(filter.categoryId
                ? {
                    categories: {
                        some: {
                            categoryId: filter.categoryId,
                        },
                    },
                }
                : {}),
        };
    }

    private buildBookListWhere(filter: BookListFilterParams): Prisma.BookWhereInput {
        return {
            isActive: true,
            deletedAt: null,
            variants: {
                some: {
                    isActive: true,
                    price: {
                        ...(filter.priceWhere ? filter.priceWhere : { gt: 0 }),
                    },
                },
            },
            translations: {
                some: {
                    languageId: filter.languageId,
                },
            },
            ...(filter.categoryId
                ? {
                    categories: {
                        some: {
                            categoryId: filter.categoryId,
                        },
                    },
                }
                : {}),
        };
    }

    buildListFilters(
        typeSort?: SearchFilterSortType,
        priceType?: SearchPriceType,
    ): {
        typeSortWhere: CatalogSortDirective | null;
        priceTypeWhere: PriceRangeFilter | null;
    } {
        return {
            typeSortWhere: typeSort ? this.resolveSortDirective(typeSort) : null,
            priceTypeWhere: priceType ? this.resolvePriceWhere(priceType) : null,
        };
    }

    private resolveSortDirective(typeSort: SearchFilterSortType): CatalogSortDirective | null {
        switch (typeSort) {
            case SearchFilterSortType.TITLE_A_Z:
                return { field: 'title', direction: 'asc' };
            case SearchFilterSortType.TITLE_Z_A:
                return { field: 'title', direction: 'desc' };
            case SearchFilterSortType.PRICE_LOW_TO_HIGH:
                return { field: 'price', direction: 'asc' };
            case SearchFilterSortType.PRICE_HIGH_TO_LOW:
                return { field: 'price', direction: 'desc' };
            default:
                return null;
        }
    }

    private resolvePriceWhere(priceType: SearchPriceType): PriceRangeFilter | null {
        switch (priceType) {
            case SearchPriceType.UNDER_100:
                return { lte: 100_000 };
            case SearchPriceType.BETWEEN_100_300:
                return { gt: 100_000, lte: 300_000 };
            case SearchPriceType.OVER_300:
                return { gt: 300_000 };
            default:
                return null;
        }
    }

    private buildBookTranslationKeywordCondition(search: CatalogKeywordSearch): Prisma.Sql {
        const likeKeyword = this.toLikePattern(search.keyword);

        if (search.mode === 'like') {
            return Prisma.sql`(
            bt.title LIKE ${likeKeyword} ESCAPE '!'
            OR bt.description LIKE ${likeKeyword} ESCAPE '!'
        )`;
        }

        return Prisma.sql`(
        MATCH(bt.title, bt.description) AGAINST (${search.keyword} IN BOOLEAN MODE)
        OR bt.title LIKE ${likeKeyword} ESCAPE '!'
        OR bt.description LIKE ${likeKeyword} ESCAPE '!'
    )`;
    }

    private buildBookTranslationScoreSelect(search: CatalogKeywordSearch): Prisma.Sql {
        if (search.mode === 'like') {
            return Prisma.sql`0 AS score`;
        }

        return Prisma.sql`MATCH(bt.title, bt.description) AGAINST (${search.keyword} IN BOOLEAN MODE) AS score`;
    }

    private buildPublicBookPriceVisibilitySql(): Prisma.Sql {
        return Prisma.sql`EXISTS (
            SELECT 1
            FROM book_variants bv_price_visibility
            WHERE bv_price_visibility.book_id = b.id
                AND bv_price_visibility.is_active = 1
                AND bv_price_visibility.price > 0
        )`;
    }

    private toLikePattern(keyword: string) {
        return `%${keyword.replace(/[\\%_]/g, '\\$&')}%`;
    }
}
