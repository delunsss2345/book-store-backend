import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthorRepository {
    constructor(private readonly prisma: PrismaService) { }

    createAuthor(defaultName: string) {
        return this.prisma.author.upsert({
            where: { defaultName },
            update: {},
            create: { defaultName }
        });
    }

    findLanguageByCode(code: string) {
        return this.prisma.language.findFirst({
            where: { code, isActive: true },
            select: { id: true, code: true },
        });
    }

    countAuthors() {
        return this.prisma.author.count();
    }

    findAuthors(languageId: number, page: number, limit: number) {
        return this.prisma.author.findMany({
            orderBy: [{ id: 'asc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                defaultName: true,
                translations: {
                    where: { languageId },
                    select: {
                        displayName: true,
                    },
                    take: 1,
                },
            },
        });
    }

    existsById(authorId: bigint) {
        return this.prisma.author
            .findUnique({ where: { id: authorId }, select: { id: true } })
            .then(Boolean);
    }
}
