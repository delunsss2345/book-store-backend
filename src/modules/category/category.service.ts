import { Injectable, NotFoundException } from '@nestjs/common';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { LanguageService } from '../language/language.service';
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
    constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly languageService: LanguageService,
    ) { }

    async createCategory(
        body: CreateCategoryRequestDto,
        actorUserId: bigint,
        lang?: string,
    ): Promise<CategoryItemResponseDto> {
        const language = await this.languageService.resolveLanguage(lang);
        const parentId =
            body.parentId !== undefined
                ? parseBigIntRequired(body.parentId, 'parentId')
                : undefined;

        if (parentId !== undefined) {
            const exists = await this.categoryRepository.existsById(parentId);
            if (!exists) {
                throw new NotFoundException('Parent category not found');
            }
        }

        const created = await this.categoryRepository.createCategory({
            parentId,
            isActive: body.isActive ?? true,
            sortOrder: body.sortOrder ?? 0,
            name: body.name,
            slug: body.slug,
            description: body.description,
            languageId: language.id,
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

    async getCategories(query: GetCategoriesQueryDto): Promise<CategoryListResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const language = await this.languageService.resolveLanguage(query.lang);

        const [total, rows] = await Promise.all([
            this.categoryRepository.countActiveCategoriesByLanguage(language.id),
            this.categoryRepository.findActiveCategoriesByLanguage(language.id, page, limit),
        ]);

        const items = rows.map((row) => this.toCategoryItem(row));
        return {
            page,
            limit,
            total,
            totalPages: total ? Math.ceil(total / limit) : 0,
            items,
        };
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
