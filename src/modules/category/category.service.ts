import { CategoryMessage } from '@/common';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryRequestDto } from './dto/request/create-category.request.dto';
import { GetCategoriesQueryDto } from './dto/request/get-categories.query.dto';
import { CategoryItemResponseDto } from './dto/response/category-item.response.dto';
import { CategoryListResponseDto } from './dto/response/category-list.response.dto';

type CategoryRow = Awaited<
  ReturnType<CategoryRepository['findActiveCategoriesByLanguage']>
>[number];

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async createCategory(
    body: CreateCategoryRequestDto,
    actorUserId: bigint,
    langId: number,
  ): Promise<CategoryItemResponseDto> {
    const parentId =
      body.parentId !== undefined
        ? parseBigIntRequired(body.parentId, 'parentId')
        : undefined;

    if (parentId !== undefined) {
      const exists = await this.categoryRepository.existsById(parentId);
      if (!exists) {
        throw new NotFoundException(CategoryMessage.PARENT_CATEGORY_NOT_FOUND);
      }
    }

    const created = await this.categoryRepository.createCategory({
      parentId,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
      name: body.name,
      slug: body.slug,
      description: body.description,
      languageId: langId,
      actorUserId,
    });

    return {
      id: created.id.toString(),
      parentId: created.parentId ? created.parentId.toString() : null,
      name: created.translation.name,
      slug: created.translation.slug ?? null,
      isActive: created.isActive,
      sortOrder: created.sortOrder,
    };
  }

  async getCategories(
    query: GetCategoriesQueryDto,
    langId: number,
  ): Promise<CategoryListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.categoryRepository.countActiveCategoriesByLanguage(langId),
      this.categoryRepository.findActiveCategoriesByLanguage(
        langId,
        page,
        limit,
      ),
    ]);

    const items = rows.map((row) => this.toCategoryItem(row));
    return buildPaginatedResult(items, total, page, limit);
  }

  private toCategoryItem(row: CategoryRow): CategoryItemResponseDto {
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
}
