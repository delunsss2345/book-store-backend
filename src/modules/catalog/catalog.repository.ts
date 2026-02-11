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
    }

    findBookDetailById(bookId: bigint, languageId: number) {
        return this.prisma.book.findFirst({
            where: {
                id: bookId,
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
    }

    groupBookRatings(bookIds?: bigint[]) {
        return this.prisma.review.groupBy({
            by: ['bookId'],
            where: {
                ...(bookIds?.length ? { bookId: { in: bookIds } } : {}),
            },
            _avg: {
                rating: true,
            },
            _count: {
                bookId: true,
            },
        });
    }

    async groupBookSales(bookIds?: bigint[]) {
        const rows = await this.prisma.orderItem.findMany({
            where: {
                bookVariantId: { not: null },
                order: {
                    status: {
                        in: VALID_SALES_ORDER_STATUSES,
                    },
                },
                ...(bookIds?.length
                    ? {
                        variant: {
                            is: {
                                bookId: { in: bookIds },
                            },
                        },
                    }
                    : {}),
            },
            select: {
                quantity: true,
                variant: {
                    select: {
                        bookId: true,
                    },
                },
            },
        });

        return rows;
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
}
