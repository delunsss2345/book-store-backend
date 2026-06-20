import { CategoryItemResponseDto } from '../dto/response/category-item.response.dto';
import { CategoryRepository } from '../repository/category.repository';

type CategoryRow = Awaited<
  ReturnType<CategoryRepository['findActiveCategoriesByLanguage']>
>[number];

type CreatedCategoryRow = Awaited<
  ReturnType<CategoryRepository['createCategory']>
>;

export function toCategoryItem(row: CategoryRow): CategoryItemResponseDto {
  const translation = row.categoryTranslation[0];

  return {
    id: row.id.toString(),
    parentId: row.parentId ? row.parentId.toString() : null,
    name: translation?.name ?? '',
    slug: translation?.slug ?? null,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

export function toCreatedCategoryItem(
  row: CreatedCategoryRow,
): CategoryItemResponseDto {
  return {
    id: row.id.toString(),
    parentId: row.parentId ? row.parentId.toString() : null,
    name: row.translation.name,
    slug: row.translation.slug ?? null,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}
