import { CategoryMessage } from '@/common';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { toCategoryItem, toCreatedCategoryItem } from '../mapper';
import { CategoryRepository } from '../repository/category.repository';
import { CreateCategoryRequestDto } from '../dto/request/create-category.request.dto';
import { GetCategoriesQueryDto } from '../dto/request/get-categories.query.dto';
import { CategoryItemResponseDto } from '../dto/response/category-item.response.dto';
import { CategoryListResponseDto } from '../dto/response/category-list.response.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async createCategory(
    body: CreateCategoryRequestDto,
    actorUserId: number,
    langId: number,
  ): Promise<CategoryItemResponseDto> {
    const parentId =
      body.parentId !== undefined
        ? Number(body.parentId)
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

    return toCreatedCategoryItem(created);
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

    const items = rows.map((row) => toCategoryItem(row));
    return buildPaginatedResult(items, total, page, limit);
  }
}
