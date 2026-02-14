import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

const VALID_REVIEW_ORDER_STATUSES: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
    OrderStatus.PACKING,
    OrderStatus.SHIPPING,
    OrderStatus.DELIVERED,
];

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

    hasPurchasedBookVariant(userId: bigint, bookVariantId: bigint) {
        console.log(bookVariantId)
        return this.prisma.orderItem.findFirst({
            where: {
                order: {
                    userId,
                    status: {
                        in: VALID_REVIEW_ORDER_STATUSES,
                    },
                },
                bookVariantSnapshot: {
                    bookVariantId,
                },
            },
            select: { id: true },
        });
    }

    findReviewByUserAndBookAndVariant(
        userId: bigint,
        bookId: bigint,
        bookVariantId: bigint,
    ) {
        return this.prisma.review.findFirst({
            where: {
                userId,
                bookId,
                bookVariantId,
            },
            select: { id: true },
        });
    }

    createReview(
        userId: bigint,
        bookId: bigint,
        bookVariantId: bigint,
        rating: number,
        content?: string | null,
    ) {
        return this.prisma.review.create({
            data: {
                userId,
                bookId,
                bookVariantId,
                rating,
                content: content ?? null,
            },
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
