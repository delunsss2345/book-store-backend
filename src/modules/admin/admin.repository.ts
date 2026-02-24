import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma, RoleCode } from '@prisma/client';

type DbClient = Prisma.TransactionClient | PrismaService;

export type CreateAdminBookParams = {
    publisherId?: bigint;
    publicationYear?: number;
    pageCount?: number;
    weightGrams?: number;
    coverImageUrl?: string;
    actorUserId: bigint;
};

export type UpdateAdminBookParams = {
    publisherId?: bigint;
    publicationYear?: number;
    pageCount?: number;
    weightGrams?: number;
    coverImageUrl?: string;
    isActive?: boolean;
};

export type CreateAdminBookTranslationParams = {
    bookId: bigint;
    languageId: number;
    title: string;
    description?: string;
    slug: string;
};

const adminBookSelect = {
    id: true,
    publisherId: true,
    publicationYear: true,
    pageCount: true,
    weightGrams: true,
    coverImageUrl: true,
    isActive: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    translations: {
        select: {
            id: true,
            languageId: true,
            title: true,
            description: true,
            slug: true,
        },
        orderBy: [{ languageId: 'asc' }],
    },
    variants: {
        select: {
            id: true,
            format: true,
            edition: true,
            isbn: true,
            costPrice: true,
            price: true,
            currencyCode: true,
            stock: true,
            isActive: true,
        },
        orderBy: [{ id: 'asc' }],
    },
} satisfies Prisma.BookSelect;

@Injectable()
export class AdminRepository {
    constructor(private readonly prisma: PrismaService) { }

    findPublisherById(publisherId: bigint) {
        return this.prisma.publisher.findUnique({
            where: { id: publisherId },
            select: { id: true },
        });
    }

    createBook(params: CreateAdminBookParams, tx?: Prisma.TransactionClient) {
        const db: DbClient = tx ?? this.prisma;

        return db.book.create({
            data: {
                publisherId: params.publisherId,
                publicationYear: params.publicationYear ?? null,
                pageCount: params.pageCount ?? null,
                weightGrams: params.weightGrams ?? null,
                coverImageUrl: params.coverImageUrl ?? null,
                isActive: false,
                createdBy: params.actorUserId,
                updatedBy: params.actorUserId,
            },
            select: adminBookSelect,
        });
    }

    findBookById(bookId: bigint, tx?: Prisma.TransactionClient) {
        const db: DbClient = tx ?? this.prisma;

        return db.book.findFirst({
            where: { id: bookId },
            select: adminBookSelect,
        });
    }

    updateBook(
        bookId: bigint,
        params: UpdateAdminBookParams,
        actorUserId: bigint,
        tx?: Prisma.TransactionClient,
    ) {
        const db: DbClient = tx ?? this.prisma;
        const data: Prisma.BookUncheckedUpdateInput = {
            updatedBy: actorUserId,
        };

        if (params.publisherId !== undefined) {
            data.publisherId = params.publisherId;
        }

        if (params.publicationYear !== undefined) {
            data.publicationYear = params.publicationYear;
        }

        if (params.pageCount !== undefined) {
            data.pageCount = params.pageCount;
        }

        if (params.weightGrams !== undefined) {
            data.weightGrams = params.weightGrams;
        }

        if (params.coverImageUrl !== undefined) {
            data.coverImageUrl = params.coverImageUrl;
        }

        if (params.isActive !== undefined) {
            data.isActive = params.isActive;
        }

        return db.book.update({
            where: { id: bookId },
            data,
            select: adminBookSelect,
        });
    }

    softDeleteBook(bookId: bigint, actorUserId: bigint, tx?: Prisma.TransactionClient) {
        const db: DbClient = tx ?? this.prisma;

        return db.book.update({
            where: { id: bookId },
            data: {
                isActive: false,
                deletedAt: new Date(),
                updatedBy: actorUserId,
            },
            select: adminBookSelect,
        });
    }

    countBooks() {
        return this.prisma.book.count({
            where: {
                deletedAt: null,
            },
        });
    }

    findBooks(page: number, limit: number, languageId: number) {
        return this.prisma.book.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                publisherId: true,
                publicationYear: true,
                pageCount: true,
                weightGrams: true,
                coverImageUrl: true,
                isActive: true,
                deletedAt: true,
                createdAt: true,
                updatedAt: true,
                translations: {
                    where: { languageId },
                    select: {
                        id: true,
                        languageId: true,
                        title: true,
                        description: true,
                        slug: true,
                    },
                    take: 1,
                },
                variants: {
                    select: {
                        id: true,
                        format: true,
                        edition: true,
                        isbn: true,
                        costPrice: true,
                        price: true,
                        currencyCode: true,
                        stock: true,
                        isActive: true,
                    },
                    orderBy: [{ id: 'asc' }],
                },
            },
        });
    }

    findBookTranslationByBookIdAndLanguage(
        bookId: bigint,
        languageId: number,
        tx?: Prisma.TransactionClient,
    ) {
        const db: DbClient = tx ?? this.prisma;

        return db.bookTranslation.findFirst({
            where: {
                bookId,
                languageId,
            },
            select: {
                id: true,
            },
        });
    }

    findBookTranslationByLanguageAndSlug(
        languageId: number,
        slug: string,
        tx?: Prisma.TransactionClient,
    ) {
        const db: DbClient = tx ?? this.prisma;

        return db.bookTranslation.findFirst({
            where: {
                languageId,
                slug,
            },
            select: {
                id: true,
            },
        });
    }

    createBookTranslation(params: CreateAdminBookTranslationParams, tx?: Prisma.TransactionClient) {
        const db: DbClient = tx ?? this.prisma;

        return db.bookTranslation.create({
            data: {
                bookId: params.bookId,
                languageId: params.languageId,
                title: params.title,
                description: params.description,
                slug: params.slug,
            },
            select: {
                id: true,
                languageId: true,
                title: true,
                description: true,
                slug: true,
            },
        });
    }

    countBookSnapshots() {
        return this.prisma.bookVariantSnapshot.count();
    }

    findBookSnapshots(page: number, limit: number) {
        return this.prisma.bookVariantSnapshot.findMany({
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                bookVariantId: true,
                titleSnapshot: true,
                coverImageUrlSnapshot: true,
                skuSnapshot: true,
                priceSnapshot: true,
                currencyCodeSnapshot: true,
                formatSnapshot: true,
                editionSnapshot: true,
                isbnSnapshot: true,
                createdAt: true,
                bookVariant: {
                    select: {
                        bookId: true,
                    },
                },
            },
        });
    }

    countUsers() {
        return this.prisma.user.count({
            where: {
                deletedAt: null,
            },
        });
    }

    findUsers(page: number, limit: number) {
        return this.prisma.user.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                isEmailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                userRoles: {
                    where: {
                        deletedAt: null,
                        role: {
                            deletedAt: null,
                            isActive: true,
                        },
                    },
                    select: {
                        role: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    }

    countNonCustomerUsers() {
        return this.prisma.user.count({
            where: {
                deletedAt: null,
                userRoles: {
                    some: {
                        deletedAt: null,
                        role: {
                            deletedAt: null,
                            isActive: true,
                            code: {
                                not: RoleCode.CUSTOMER,
                            },
                        },
                    },
                },
            },
        });
    }

    findNonCustomerUsers(page: number, limit: number) {
        return this.prisma.user.findMany({
            where: {
                deletedAt: null,
                userRoles: {
                    some: {
                        deletedAt: null,
                        role: {
                            deletedAt: null,
                            isActive: true,
                            code: {
                                not: RoleCode.CUSTOMER,
                            },
                        },
                    },
                },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                isEmailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                userRoles: {
                    where: {
                        deletedAt: null,
                        role: {
                            deletedAt: null,
                            isActive: true,
                        },
                    },
                    select: {
                        role: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    }

    countOrders() {
        return this.prisma.order.count();
    }

    findOrders(page: number, limit: number) {
        return this.prisma.order.findMany({
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                orderCode: true,
                userId: true,
                guestSessionId: true,
                guestEmail: true,
                status: true,
                paymentStatus: true,
                subtotal: true,
                discountAmount: true,
                shippingFee: true,
                totalAmount: true,
                currencyCode: true,
                placedAt: true,
                createdAt: true,
                expiredAt: true,
                updatedAt: true,
            },
        });
    }

    findOrderDetailById(orderId: bigint) {
        return this.prisma.order.findFirst({
            where: {
                id: orderId,
            },
            select: {
                id: true,
                orderCode: true,
                userId: true,
                guestSessionId: true,
                guestEmail: true,
                status: true,
                paymentStatus: true,
                subtotal: true,
                discountAmount: true,
                shippingFee: true,
                totalAmount: true,
                currencyCode: true,
                placedAt: true,
                createdAt: true,
                expiredAt: true,
                updatedAt: true,
                items: {
                    orderBy: [{ id: 'asc' }],
                    select: {
                        id: true,
                        bookVariantSnapshotId: true,
                        quantity: true,
                        unitPrice: true,
                        lineTotal: true,
                        createdAt: true,
                        bookVariantSnapshot: {
                            select: {
                                titleSnapshot: true,
                                coverImageUrlSnapshot: true,
                                skuSnapshot: true,
                                priceSnapshot: true,
                                currencyCodeSnapshot: true,
                                formatSnapshot: true,
                                editionSnapshot: true,
                                isbnSnapshot: true,
                            },
                        },
                    },
                },
            },
        });
    }
}
