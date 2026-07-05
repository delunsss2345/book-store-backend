import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import {
  buildActiveCategoryListSelect,
  createCategoryTranslationSelect,
} from '../select';

export type CreateCategoryParams = {
  parentId?: number;
  isActive: boolean;
  sortOrder: number;
  name: string;
  slug?: string;
  description?: string;
  languageId: number;
  actorUserId: number;
};

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  existsById(categoryId: number) {
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

  findActiveCategoriesByLanguage(
    languageId: number,
    page: number,
    limit: number,
  ) {
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
      select: buildActiveCategoryListSelect(languageId),
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
        select: createCategoryTranslationSelect,
      });

      return { ...category, translation };
    });
  }
}
