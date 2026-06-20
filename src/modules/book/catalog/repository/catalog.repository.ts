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
    categoryId?: number;
};

export type BookListFilterParams = {
    languageId: number;
    categoryId?: number;
};

type FindBooksForListParams = {
    languageId: number;
    page: number;
    limit: number;
    categoryId?: number;
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
                    take: 1,
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

    countBooksForList(languageId: number) {
        return this.prisma.book.count({
            where: this.buildBookListWhere({ languageId }),
        });
    }

    countBooksForListByCategory(categoryId: number, languageId: number) {
        return this.prisma.book.count({
            where: this.buildBookListWhere({ languageId, categoryId }),
        });
    }

    findBooksForList(languageId: number, page: number, limit: number) {
        return this.findBooksForListByFilter({
            languageId,
            page,
            limit,
        });
    }

    findBooksForListByCategory(
        categoryId: number,
        languageId: number,
        page: number,
        limit: number,
    ) {
        return this.findBooksForListByFilter({
            languageId,
            categoryId,
            page,
            limit,
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
            where: { id: bookVariantId },
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
                            take: 1,
                        },
                    },
                },
            },
        });
    }

    findBookVariantByIds(bookVariantId: number[]) {
        return this.prisma.bookVariant.findMany({
            where: { id: { in: bookVariantId } },
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
                            take: 1,
                        },
                    },
                },
            },
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

    findBooksByIds(bookIds: number[], languageId: number, page = 1, limit = 20) {
        if (!bookIds.length) {
            return Promise.resolve([]);
        }

        return this.prisma.book.findMany({
            skip: (page - 1) * limit,
            take: 20,
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

    findBooksVariantByIds(bookVariantId: number[], languageId: number, take: number = 20) {
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

    findActiveBookVariantsForSearchIndex() {
        return this.prisma.bookVariant.findMany({
            where: {
                isActive: true,
                book: {
                    isActive: true,
                    deletedAt: null,
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
                    where: { isActive: true },
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
                coverImageUrl: true,
                translations: {
                    select: {
                        title: true,
                        slug: true,
                    },
                    take: 1
                },
                categories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                parentId: true,
                                sortOrder: true,
                                categoryTranslation: {
                                    select: { name: true, slug: true },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                variants: {
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
                    take: 1
                }
            }
        })
    }

    // Gom review lại sau đó tính trung bình rate của review là bao nhiêu sao 
    // Điểm số lượng sách được review 
    async groupBookRatings(limit = 10) {
        const rows = await this.prisma.$queryRaw<{ bookId: number | string; bookVariantId: number | string; avgRating: number }[]>(Prisma.sql`
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
            { bookId: number | string; bookVariantId: string | number, soldQty: number | string }[]
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
            bookId: Number(r.bookId),
            bookVariantId: Number(r.bookVariantId),
            soldQty: Number(r.soldQty) // tổng số lượng đã bán
        }));
    }

    private findBooksForListByFilter(params: FindBooksForListParams) {
        const { languageId, categoryId, page, limit } = params;

        return this.prisma.book.findMany({
            where: this.buildBookListWhere({ languageId, categoryId }),
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
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                variants: {
                    where: { isActive: true },
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
}
