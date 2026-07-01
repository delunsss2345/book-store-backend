import { CatalogMessage, cacheKey } from '@/common';
import {
  CATALOG_CATEGORY_CACHE_TTL_SECONDS,
  CATALOG_DETAIL_CACHE_TTL_SECONDS,
  CATALOG_HOME_CACHE_TTL_SECONDS,
  CATALOG_LIST_CACHE_TTL_SECONDS,
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
  toCatalogHomeBookCard,
  toCatalogListBookCard,
} from '../mapper/catalog.mapper';
import {
  CatalogKeywordSearch,
  CatalogRepository,
} from '../repository/catalog.repository';

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
  ): Promise<CatalogBookCardDto[]> {
    const limit = query.limit ?? 12;
    const key = cacheKey.catalog.home(langId, limit);

    return this.cache.withCache(key, CATALOG_HOME_CACHE_TTL_SECONDS, async () => {
      const books = await this.repo.findCatalogHomeBooks(langId, limit * 5);
      return this.shuffle(books)
        .slice(0, limit)
        .map(toCatalogHomeBookCard);
    });
  }

  async getCategories(langId: number): Promise<CatalogCategoryTreeDto[]> {
    const key = cacheKey.catalog.categories(langId);

    return this.cache.withCache(key, CATALOG_CATEGORY_CACHE_TTL_SECONDS, async () => {
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
    const keyword = query.keyword?.trim() || undefined;
    const keywordSearch = keyword
      ? this.buildKeywordSearch(keyword)
      : undefined;

    if (slugCategory) {
      return this.cache.withCache(
        cacheKey.catalog.bookListByCategory(langId, page, limit, slugCategory),
        CATALOG_LIST_CACHE_TTL_SECONDS,
        async () => {
          const category = await this.repo.findCategoryBySlug(slugCategory, langId);
          if (!category) {
            throw new NotFoundException(CatalogMessage.CATEGORY_NOT_FOUND);
          }

          if (keyword) {
            const [ids, total] = await Promise.all([
              this.repo.findBookIncludeCategory(category.id, langId, keywordSearch!, page, limit),
              this.repo.countBookIncludeCategory(category.id, langId, keywordSearch!),
            ]);
            const rows = await this.repo.findBooksByIds(ids, langId);
            return buildPaginatedResult(rows.map(toCatalogListBookCard), total, page, limit);
          }

          const [rows, total] = await Promise.all([
            this.repo.findBooksForListByCategory(category.id, langId, page, limit),
            this.repo.countBooksForListByCategory(category.id, langId),
          ]);
          return buildPaginatedResult(rows.map(toCatalogListBookCard), total, page, limit);
        },
      );
    }

    if (keyword) {
      const [ids, total] = await Promise.all([
        this.repo.findBookNeIncludeCategory(langId, keywordSearch!, page, limit),
        this.repo.countBookNeIncludeCategory(langId, keywordSearch!),
      ]);
      const rows = await this.repo.findBooksByIds(ids, langId);

      return buildPaginatedResult(rows.map(toCatalogListBookCard), total, page, limit);
    }

    return this.cache.withCache(
      cacheKey.catalog.bookList(langId, page, limit),
      CATALOG_LIST_CACHE_TTL_SECONDS,
      async () => {
        const [rows, total] = await Promise.all([
          this.repo.findBooksQueryRaw(langId, page, limit),
          this.repo.countBookQueryRaw(langId),
        ]);
        return buildPaginatedResult(rows.map(toCatalogListBookCard), total, page, limit);
      },
    );
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

    return this.cache.withCache(key, CATALOG_DETAIL_CACHE_TTL_SECONDS, async () => {
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

    return this.cache.withCache(key, CATALOG_DETAIL_CACHE_TTL_SECONDS, async () => {
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


  private pickCards(
    ids: number[],
    map: Map<string, CatalogBookCardDto>,
  ): CatalogBookCardDto[] {
    return ids
      .map((id) => map.get(id.toString()))
      .filter((x) => x != undefined && x != null);
  }

  private buildKeywordSearch(keyword: string): CatalogKeywordSearch {
    return {
      keyword,
      mode: keyword.length > 3 ? 'fulltext' : 'like',
    };
  }

  private shuffle<T>(items: T[]): T[] {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
