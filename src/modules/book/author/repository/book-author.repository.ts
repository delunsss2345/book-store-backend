import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BookAuthorRepository {
    constructor(private readonly prisma: PrismaService) { }

    countBooksByAuthor(authorId: number, languageId: number) {
        return this.prisma.bookAuthor.count({
            where: {
                authorId,
                book: {
                    isActive: true,
                    deletedAt: null,
                    variants: {
                        every: {
                            price: {
                                gt: 0,
                            },
                        },
                    },
                    translations: {
                        some: { languageId },
                    },
                },
            },
        });
    }

    findBooksByAuthor(authorId: number, languageId: number, page: number, limit: number) {
        return this.prisma.bookAuthor.findMany({
            where: {
                authorId,
                book: {
                    isActive: true,
                    deletedAt: null,
                    variants: {
                        every: {
                            price: {
                                gt: 0,
                            },
                        },
                    },
                    translations: {
                        some: { languageId },
                    },
                },
            },
            orderBy: [{ book: { createdAt: 'desc' } }, { bookId: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                isPrimary: true,
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
                        variants: {
                            where: { isActive: true, price: { gt: 0 } },
                            orderBy: [{ price: 'asc' }, { id: 'asc' }],
                            take: 1,
                            select: {
                                price: true,
                            },
                        },
                    },
                },
            },
        });
    }
}
