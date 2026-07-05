import { Prisma } from '@prisma/client';

export const activeCategoryListSelect = {
  id: true,
  parentId: true,
  isActive: true,
  sortOrder: true,
} as const;

export function buildActiveCategoryListSelect(languageId: number) {
  return {
    ...activeCategoryListSelect,
    categoryTranslation: {
      where: { languageId },
      select: {
        name: true,
        slug: true,
      },
      take: 1,
    },
  } satisfies Prisma.CategorySelect;
}

export const createCategoryTranslationSelect = {
  name: true,
  slug: true,
} satisfies Prisma.CategoryTranslationSelect;
