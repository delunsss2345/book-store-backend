import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewRepository {
    constructor(private readonly prisma: PrismaService) { }

    findLanguageByCode(code: string) {
        return this.prisma.language.findFirst({
            where: { code, isActive: true },
            select: { id: true, code: true },
        });
    }

    findBookBySlug(slug: string, languageId: number) {
        return this.prisma.book.findFirst({
            where: {
                isActive: true,
                deletedAt: null,
                translations: {
                    some: { languageId, slug },
                },
            },
            select: { id: true },
        });
    }

    countReviewsByBookId(bookId: bigint) {
        return this.prisma.review.count({
            where: { bookId },
        });
    }

    findReviewsByBookId(bookId: bigint, page: number, limit: number) {
        return this.prisma.review.findMany({
            where: { bookId },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                userId: true,
                rating: true,
                content: true,
                createdAt: true,
                bookVariant: {
                    select: {
                        id: true,
                        format: true,
                    },
                },
            },
        });
    }
}
