import { CatalogMessage, cacheKey } from '@/common';
import {
  CATEGORY_CACHE_TTL,
  DETAIL_CACHE_TTL,
  HOME_CACHE_TTL,
  LIST_CACHE_TTL,
} from '@/common/constants/enum-ttl.constant';
import {
  buildPaginatedResult,
  getPaginationParams,
} from '@/common/pagination/base-pagination.util';
import {
  CatalogBookListQueryDto,
  CatalogHomeQueryDto,
} from '@/modules/book/catalog/dto/request';
import {
  CatalogBookCardDto,
  CatalogBookDetailDto,
  CatalogBookListResponseDto,
  CatalogCategoryTreeDto,
} from '@/modules/book/catalog/dto/response';
import { CacheVersionService } from '@/modules/cache-version/service/cache-version.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {
  buildCatalogCategoryTree,
  toCatalogBookCard,
  toCatalogBookDetail,
  toCatalogListBookCard,
} from '../mapper/catalog.mapper';
import { CatalogRepository } from '../repository/catalog.repository';

@Injectable()
export class CatalogService {
  constructor(
    private readonly repo: CatalogRepository,
    private readonly cache: CacheVersionService
  ) { }

  // Lấy giớ hạn không lấy phân trang
  async getCatalogHome(
    query: CatalogHomeQueryDto,
    langId: number,
  ): Promise<any> {
    const limit = query.limit ?? 12;
    const key = cacheKey.catalog.home(langId, limit);

    return this.cache.withCache(key, HOME_CACHE_TTL, async () => {
      const [newestRows, saleTopLimit] = await Promise.all([
        this.repo.findNewestActiveBookIds(langId, limit),
        this.repo.groupBookSales(limit),
      ]);

      const newestIds = newestRows.map((r) => r.id);
      const bestSellerBookIds = saleTopLimit.map((r) => Number(r.bookId));

      const allUniqueIds = this.uniqueBigIntIds([
        ...bestSellerBookIds,
        ...newestIds,
      ]);

      const cardMap = await this.buildCardMap(allUniqueIds, langId);

      return {
        newAndTrending: this.pickCards(allUniqueIds, cardMap),
      };
    });
  }

  async getCategories(langId: number): Promise<CatalogCategoryTreeDto[]> {
    const key = cacheKey.catalog.categories(langId);

    return this.cache.withCache(key, CATEGORY_CACHE_TTL, async () => {
      const rows = await this.repo.findActiveCategoriesByLanguage(langId);
      return buildCatalogCategoryTree(rows);
    });
  }

  async getBookCardsByVariantIds(
    variantIds: string[],
    langId: number,
  ): Promise<Map<string, CatalogBookCardDto>> {
    const parsedIds = variantIds
      .map((id) => (id ? Number(id) : undefined))
      .filter((id): id is number => id != undefined);

    if (!parsedIds.length) {
      return new Map<string, CatalogBookCardDto>();
    }

    return this.buildCardVariantMap(parsedIds, langId);
  }

  // Cho phép domain khác (vd OrderService) lấy variant theo ids qua service thay vì repository
  findBookVariantByIds(ids: number[]) {
    return this.repo.findBookVariantByIds(ids);
  }

  // Cho phép domain khác (vd PineconeService) lấy variant đầu tiên của sách active qua service
  findActiveBookFirstVariant() {
    return this.repo.findActiveBookFirstVariant();
  }

  private async buildCardMap(
    ids: number[],
    languageId: number,
  ): Promise<Map<string, CatalogBookCardDto>> {
    const books = await this.repo.findBooksByIds(ids, languageId);
    return new Map<string, CatalogBookCardDto>(
      books.map((book): [string, CatalogBookCardDto] => [
        book.id.toString(),
        toCatalogBookCard(book),
      ]),
    );
  }

  private async buildCardVariantMap(
    ids: number[],
    languageId: number,
  ): Promise<Map<string, CatalogBookCardDto>> {
    const variants = await this.repo.findBooksVariantByIds(
      ids,
      languageId,
      ids.length,
    );
    return new Map<string, CatalogBookCardDto>(
      variants.map((variant): [string, CatalogBookCardDto] => [
        variant.bookVariantId!.toString(),
        variant,
      ]),
    );
  }

  async listBooks(
    query: CatalogBookListQueryDto,
    langId: number,
  ): Promise<CatalogBookListResponseDto> {
    const { page, limit } = getPaginationParams(query.page, query.limit);
    const slugCategory = query.slugCategory?.trim();
    const keyword = query.keyword?.trim();
    const key = cacheKey.catalog.bookList(langId, page, limit);

    if (slugCategory) {
      return this.cache.withCache(
        cacheKey.catalog.bookListByCategory(langId, page, limit, slugCategory),
        LIST_CACHE_TTL,
        async () => {
          const category = await this.repo.findCategoryBySlug(
            slugCategory,
            langId,
          );
          if (!category) {
            throw new NotFoundException(CatalogMessage.CATEGORY_NOT_FOUND);
          }

          const [total, rows] = await Promise.all([
            this.repo.countBooksForListByCategory(category.id, langId),
            this.repo.findBooksForListByCategory(
              category.id,
              langId,
              page,
              limit,
            ),
          ]);

          const items: CatalogBookCardDto[] = rows.map((book) =>
            toCatalogListBookCard(book),
          );

          return buildPaginatedResult(items, total, page, limit);
        },
      );
    }

    return this.cache.withCache(key, LIST_CACHE_TTL, async () => {
      const [total, rows] = await Promise.all([
        this.repo.countBooksForList(langId),
        this.repo.findBooksForList(langId, page, limit),
      ]);

      const items: CatalogBookCardDto[] = rows.map((book) =>
        toCatalogListBookCard(book),
      );

      return buildPaginatedResult(items, total, page, limit);
    });
  }

  async queryListBook(
    query: CatalogBookListQueryDto,
    ids: number[],
    langId: number,
  ): Promise<CatalogBookListResponseDto> {
    const { page, limit } = getPaginationParams(query.page, query.limit);

    const [total, rows] = await Promise.all([
      this.repo.countBooksForList(langId),
      this.repo.findBooksByIds(ids, langId, page, limit),
    ]);

    const items: CatalogBookCardDto[] = rows.map((book) =>
      toCatalogListBookCard(book),
    );

    return buildPaginatedResult(items, total, page, limit);
  }

  async getBookDetail(
    bookId: number,
    langId: number,
  ): Promise<CatalogBookDetailDto> {
    const key = cacheKey.catalog.bookDetail(bookId, langId);

    return this.cache.withCache(key, DETAIL_CACHE_TTL, async () => {
      const book = await this.repo.findBookDetailById(bookId, langId);
      if (!book) throw new NotFoundException(CatalogMessage.BOOK_NOT_FOUND);
      return toCatalogBookDetail(book);
    });
  }

  async getBookDetailBySlug(
    slug: string,
    langId: number,
  ): Promise<CatalogBookDetailDto> {
    const normalizedSlug = slug?.trim();
    if (!normalizedSlug) {
      throw new BadRequestException(CatalogMessage.SLUG_REQUIRED);
    }

    const key = cacheKey.catalog.bookDetailBySlug(normalizedSlug, langId);

    return this.cache.withCache(key, DETAIL_CACHE_TTL, async () => {
      const book = await this.repo.findBookDetailBySlug(normalizedSlug, langId);
      if (!book) throw new NotFoundException(CatalogMessage.BOOK_NOT_FOUND);
      const bookIds = new Set(book.categories.map((c) => c.category.id));

      const bookSame = await this.repo.findBookAlikeCategory(
        book.id,
        Array.from(bookIds),
      );

      const scored = bookSame
        .map((b) => {
          const otherIds = b.categories.map((c) => c.category.id);
          const score = this.calculateJaccard(Array.from(bookIds), otherIds);
          return { id: b.id, score, book: b };
        })
        .sort((a, b) => Number(b.score) - Number(a.score));

      const top = scored.slice(0, 4);
      const recommendIds = top.map((item) => item.id);
      const recommendMap = await this.buildCardMap(recommendIds, langId);
      const recommend = this.pickCards(recommendIds, recommendMap);
      return toCatalogBookDetail(book, normalizedSlug, recommend);
    });
  }

  // Thuật toán độ tương đồng Jaccard (Intersection over Union)
  calculateJaccard(
    currentCategories: number[],
    targetCategories: number[],
  ): number {
    const setA = new Set(currentCategories);
    const setB = new Set(targetCategories);

    // Tìm phần giao (Intersection) (xem giống nhau bao nhiêu)
    const intersection = new Set([...setA].filter((x) => setB.has(x)));

    // Tìm phần hợp (Union) (lọc ra các trùm lặp)
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
  }

  private async withCache<T>(
    key: string,
    ttl: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached) return cached;

    const value = await factory();
    await this.cache.set(key, value, ttl);
    return value;
  }

  private pickCards(
    ids: number[],
    map: Map<string, CatalogBookCardDto>,
  ): CatalogBookCardDto[] {
    return ids
      .map((id) => map.get(id.toString()))
      .filter((x) => x != undefined && x != null);
  }

  // Build unique mục đính trùng lọc trùng id tối ưu query nhanh
  private uniqueBigIntIds(ids: number[]): number[] {
    return [...new Map(ids.map((id) => [id.toString(), id])).values()];
  }
}
