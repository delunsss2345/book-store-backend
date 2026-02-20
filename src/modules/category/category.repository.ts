import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

export type CreateCategoryParams = {
    parentId?: bigint;
    isActive: boolean;
    sortOrder: number;
    name: string;
    slug?: string;
    description?: string;
    languageId: number;
    actorUserId: bigint;
};

@Injectable()
export class CategoryRepository {
    constructor(private readonly prisma: PrismaService) { }

    findLanguageByCode(code: string) {
        return this.prisma.language.findFirst({
            where: { code, isActive: true },
            select: { id: true, code: true },
        });
    }

    existsById(categoryId: bigint) {
        return this.prisma.category
            .findFirst({
                where: {
                    id: categoryId,
                    deletedAt: null,
                },
                select: { id: true },
            })
            .then(Boolean);
    }

    countActiveCategoriesByLanguage(languageId: number) {
        return this.prisma.category.count({
            where: {
                isActive: true,
                deletedAt: null,
                categoryTranslation: {
                    some: { languageId },
                },
            },
        });
    }

    findActiveCategoriesByLanguage(languageId: number, page: number, limit: number) {
        return this.prisma.category.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                categoryTranslation: {
                    some: { languageId },
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                parentId: true,
                isActive: true,
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

    createCategory(params: CreateCategoryParams) {
        return this.prisma.$transaction(async (tx) => {
            const category = await tx.category.create({
                data: {
                    parentId: params.parentId,
                    isActive: params.isActive,
                    sortOrder: params.sortOrder,
                    createdBy: params.actorUserId,
                    updatedBy: params.actorUserId,
                },
                select: {
                    id: true,
                    parentId: true,
                    isActive: true,
                    sortOrder: true,
                },
            });

            const translation = await tx.categoryTranslation.create({
                data: {
                    categoryId: category.id,
                    languageId: params.languageId,
                    name: params.name,
                    slug: params.slug,
                    description: params.description,
                },
                select: {
                    name: true,
                    slug: true,
                },
            });

            return { ...category, translation };
        });
    }
}
