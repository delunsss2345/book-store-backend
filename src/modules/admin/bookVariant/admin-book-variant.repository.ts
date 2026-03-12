import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type DbClient = Prisma.TransactionClient | PrismaService;

export type CreateAdminBookParams = {
    publisherId?: bigint;
    publicationYear?: number;
    pageCount?: number;
    weightGrams?: number;
    coverImageUrl?: string;
    actorUserId: bigint;
    supplerId: bigint
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

export type CreateBookAuthorLinkInput = {
    authorId: bigint;
    isPrimary?: boolean;
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
export class AdminBookVariantsRepository {
    constructor(private readonly prisma: PrismaService) { }

    private buildBookListWhere(
        languageId: number,
        searchPhrase?: string,
    ): Prisma.BookWhereInput {
        return {
            deletedAt: null,
            ...(searchPhrase
                ? {
                    translations: {
                        some: {
                            languageId,
                            title: {
                                contains: searchPhrase,
                            },
                        },
                    },
                }
                : {}),
        };
    }

    countBookVariants(languageId: number, searchPhrase?: string) {
        return this.prisma.bookVariant.count({
            where: {
                book: this.buildBookListWhere(languageId, searchPhrase),
            },
        });
    }
    findBookVariants(
        page: number,
        limit: number,
        languageId: number,
        searchPhrase?: string,
    ) {
        return this.prisma.book.findMany({
            where: this.buildBookListWhere(languageId, searchPhrase),
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

    createBookTranslation(
        params: CreateAdminBookTranslationParams,
        tx?: Prisma.TransactionClient,
    ) {
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
}
