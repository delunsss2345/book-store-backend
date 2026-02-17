import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

export const VALID_SALES_ORDER_STATUSES: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.PACKING,
    OrderStatus.SHIPPING,
    OrderStatus.DELIVERED,
];

export type BookFilterParams = {
    languageId: number;
    q?: string;
    categoryId?: bigint;
};

export type BookListFilterParams = {
    languageId: number;
};

@Injectable()
export class CatalogRepository {
    constructor(private readonly prisma: PrismaService) { }


    findLanguageByCode(code: string) {
        return this.prisma.language.findFirst({
            where: { code, isActive: true },
            select: { id: true, code: true },
        });
    }

    findDefaultLanguage() {
        return this.prisma.language.findFirst({
            where: { isActive: true },
            orderBy: { id: 'asc' },
            select: { id: true, code: true },
        });
    }

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
                    take: 1,
                },
            },
        });
    }

    countBooksForList(languageId: number) {
        return this.prisma.book.count({
            where: this.buildBookListWhere({ languageId }),
        });
    }

    findBooksForList(languageId: number, page: number, limit: number) {
        return this.prisma.book.findMany({
            where: this.buildBookListWhere({ languageId }),
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
                    take: 1,
                },
                bookBadge: {
                    select: {
                        code: true
                    }
                },
                variants: {
                    where: { isActive: true },
                    orderBy: [{ price: 'asc' }, { id: 'asc' }],
                    take: 1,
                    select: {
                        price: true,
                        currencyCode: true,
                        stock: true,
                    },
                },
            },
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

    findNewestActiveBookIds(languageId: number, limit: number) {
        return this.prisma.book.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                translations: {
                    some: {
                        languageId,
                    },
                },
            },
            select: { id: true },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: limit,
        });
    }

    findBooksByIds(bookIds: bigint[], languageId: number) {
        if (!bookIds.length) {
            return Promise.resolve([]);
        }

        return this.prisma.book.findMany({
            where: {
                id: { in: bookIds },
                isActive: true,
                deletedAt: null,
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
                    take: 1,
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
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                variants: {
                    where: { isActive: true },
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

    findBooksVariantByIds(bookVariantId: bigint[], languageId: number, take: number = 20) {
        if (!bookVariantId.length) {
            return Promise.resolve([]);
        }

        return this.prisma.bookVariant.findMany({
            where: {
                id: { in: bookVariantId },
                isActive: true,
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
                            take: 1,
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
                                            take: 1,
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
    }

    // repo
    async findBookDetailById(bookId: bigint, languageId: number) {
        const [bookDetail, ratingAgg] = await Promise.all([
            this.prisma.book.findFirst({
                where: { id: bookId, isActive: true, deletedAt: null },
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
                        take: 1,
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
                                        take: 1,
                                    },
                                },
                            },
                        },
                    },
                    variants: {
                        where: { isActive: true },
                        orderBy: [{ price: "asc" }, { id: "asc" }],
                        select: {
                            id: true,
                            format: true,
                            edition: true,
                            isbn: true,
                            price: true,
                            currencyCode: true,
                            stock: true,
                        },
                    },
                },
            }),

            this.prisma.review.aggregate({
                where: { bookVariant: { bookId, isActive: true } },
                _avg: { rating: true },
                _count: { rating: true },
            }),
        ]);

        if (!bookDetail) return null;

        return {
            ...bookDetail,
            ratingAvg: ratingAgg._avg.rating ?? null,
            ratingCount: ratingAgg._count.rating ?? 0,
        };
    }

    async findBookDetailBySlug(slug: string, languageId: number) {
        const bookDetail = await this.prisma.book.findFirst({
            where: {
                isActive: true,
                deletedAt: null,
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
                    take: 1,
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
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                variants: {
                    where: { isActive: true },
                    orderBy: [{ price: 'asc' }, { id: 'asc' }],
                    select: {
                        id: true,
                        format: true,
                        edition: true,
                        isbn: true,
                        price: true,
                        currencyCode: true,
                        stock: true,
                    },
                },
            },
        });

        if (!bookDetail) return null;

        const ratingAgg = await this.prisma.review.aggregate({
            where: { bookVariant: { bookId: bookDetail.id, isActive: true } },
            _avg: { rating: true },
            _count: { rating: true },
        });

        return {
            ...bookDetail,
            ratingAvg: ratingAgg._avg.rating ?? null,
            ratingCount: ratingAgg._count.rating ?? 0,
        };
    }


    // Gom review lại sau đó tính trung bình rate của review là bao nhiêu sao 
    // Điểm số lượng sách được review 
    async groupBookRatings(limit = 10) {
        const rows = await this.prisma.$queryRaw<{ bookId: bigint | string | number; bookVariantId: bigint | string | number; avgRating: bigint | number }[]>(Prisma.sql`
        SELECT reviews.book_id as bookId, reviews.book_variant_id as bookVariantId , AVG(reviews.rating) as avgRating FROM reviews 
        GROUP BY reviews.book_id , reviews.book_variant_id
        ORDER BY AVG(reviews.rating) DESC LIMIT ${limit}
        `);

        return rows.map(r => ({
            bookId: r.bookId,
            bookVariantId: r.bookVariantId,
            avgRating: r.avgRating
        }))
    }
    // Gom lại số sản phẩm đã bán tìm varariant đã được bán và sách gốc là sách nào 
    // biến thể được bán đó là có sách gốc là gì
    async groupBookSales(limit = 10) {
        const rows = await this.prisma.$queryRaw<
            { bookId: bigint | string | number; bookVariantId: string | number | bigint, soldQty: bigint | string | number }[]
        >(Prisma.sql`
    SELECT bv.book_id AS bookId, bvs.book_variant_id as bookVariantId , SUM(oi.quantity) AS soldQty
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN book_variant_snapshots bvs ON bvs.id = oi.book_variant_snapshot_id
    JOIN book_variants bv ON bv.id = bvs.book_variant_id
    WHERE o.status IN (${Prisma.join(VALID_SALES_ORDER_STATUSES)})
    GROUP BY bv.book_id , bvs.book_variant_id
    ORDER BY soldQty DESC
    LIMIT ${limit}
  `);

        return rows.map(r => ({
            bookId: BigInt(r.bookId),
            bookVariantId: BigInt(r.bookVariantId),
            soldQty: BigInt(r.soldQty) // tổng số lượng đã bán
        }));
    }


    private buildBookWhere(filter: BookFilterParams): Prisma.BookWhereInput {
        return {
            isActive: true,
            deletedAt: null,
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
            translations: {
                some: {
                    languageId: filter.languageId,
                },
            },
        };
    }
}
