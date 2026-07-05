import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PublisherRepository {
    constructor(private readonly prisma: PrismaService) { }

    createPublisher(defaultName: string) {
        return this.prisma.publisher.upsert({
            where: { defaultName: defaultName.toLocaleLowerCase() },
            update: {},
            create: { defaultName }
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

    existsById(publisherId: number) {
        return this.prisma.publisher
            .findUnique({ where: { id: publisherId }, select: { id: true } })
            .then(Boolean);
    }

    countBooksByPublisher(publisherId: number, languageId: number) {
        return this.prisma.book.count({
            where: {
                publisherId,
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
        });
    }

    findBooksByPublisher(
        publisherId: number,
        languageId: number,
        page: number,
        limit: number,
    ) {
        return this.prisma.book.findMany({
            where: {
                publisherId,
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
                    where: { isActive: true, price: { gt: 0 } },
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
