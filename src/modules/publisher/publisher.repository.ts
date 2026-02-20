import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PublisherRepository {
    constructor(private readonly prisma: PrismaService) { }

    createPublisher(defaultName: string) {
        return this.prisma.publisher.create({
            data: { defaultName },
            select: {
                id: true,
                defaultName: true,
            },
        });
    }

    findLanguageByCode(code: string) {
        return this.prisma.language.findFirst({
            where: { code, isActive: true },
            select: { id: true, code: true },
        });
    }

    countPublishers() {
        return this.prisma.publisher.count();
    }

    findPublishers(page: number, limit: number) {
        return this.prisma.publisher.findMany({
            orderBy: [{ id: 'asc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                defaultName: true,
            },
        });
    }

    existsById(publisherId: bigint) {
        return this.prisma.publisher
            .findUnique({ where: { id: publisherId }, select: { id: true } })
            .then(Boolean);
    }

    countBooksByPublisher(publisherId: bigint, languageId: number) {
        return this.prisma.book.count({
            where: {
                publisherId,
                isActive: true,
                deletedAt: null,
                translations: {
                    some: { languageId },
                },
            },
        });
    }

    findBooksByPublisher(
        publisherId: bigint,
        languageId: number,
        page: number,
        limit: number,
    ) {
        return this.prisma.book.findMany({
            where: {
                publisherId,
                isActive: true,
                deletedAt: null,
                translations: {
                    some: { languageId },
                },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
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
                    where: { isActive: true },
                    orderBy: [{ price: 'asc' }, { id: 'asc' }],
                    take: 1,
                    select: {
                        price: true,
                    },
                },
            },
        });
    }
}
