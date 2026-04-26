import { CatalogMessage } from '@/common';
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
} from '@/modules/catalog/dto/request';
import {
  CatalogBookCardDto,
  CatalogBookDetailDto,
  CatalogBookListResponseDto,
  CatalogBookSpecDto,
  CatalogBookVariantDto,
  CatalogCategoryDto,
  CatalogCategoryTreeDto,
} from '@/modules/catalog/dto/response';
import { parseBigIntOptional } from '@/utils/parseBigInt.util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Badge } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { CatalogRepository } from './catalog.repository';

type CategoryRow = Awaited<
  ReturnType<CatalogRepository['findActiveCategoriesByLanguage']>
>[number];
type BookDetailByIdRow = NonNullable<
  Awaited<ReturnType<CatalogRepository['findBookDetailById']>>
>;


type BookListRow = Awaited<
  ReturnType<CatalogRepository['findBooksForList']>
>[number];

@Injectable()
export class CatalogService {
  constructor(
    private readonly repo: CatalogRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) { }

  // Lấy giớ hạn không lấy phân trang
  async getCatalogHome(
    query: CatalogHomeQueryDto,
    langId: number,
  ): Promise<any> {
    const limit = query.limit ?? 12;
    const cacheKey = `catalog:home:${langId}:${limit}`;

    return this.withCache(cacheKey, HOME_CACHE_TTL, async () => {
      const [newestRows, saleTopLimit] = await Promise.all([
        this.repo.findNewestActiveBookIds(langId, limit),
        this.repo.groupBookSales(limit),
      ]);

      const newestIds = newestRows.map((r) => r.id);
      const bestSellerIdsVariant = saleTopLimit.map((r) =>
        BigInt(r.bookVariantId),
      );

      const allUniqueIds = this.uniqueBigIntIds([
        ...bestSellerIdsVariant,
        ...newestIds,
      ]);

      const cardMap = await this.buildCardMap(allUniqueIds, langId);

      return {
        newAndTrending: this.pickCards(allUniqueIds, cardMap),
      };
    });
  }

  async getCategories(langId: number): Promise<CatalogCategoryTreeDto[]> {
    const cacheKey = `catalog:categories:${langId}`;

    return this.withCache(cacheKey, CATEGORY_CACHE_TTL, async () => {
      const rows = await this.repo.findActiveCategoriesByLanguage(langId);
      return this.buildCategoryTree(rows);
    });
  }

  async getBookCardsByVariantIds(
    variantIds: string[],
    langId: number,
  ): Promise<Map<string, CatalogBookCardDto>> {
    const parsedIds = variantIds
      .map((id) => parseBigIntOptional(id))
      .filter((id): id is bigint => id != undefined);

    if (!parsedIds.length) {
      return new Map<string, CatalogBookCardDto>();
    }

    return this.buildCardVariantMap(parsedIds, langId);
  }

  private async buildCardMap(
    ids: bigint[],
    languageId: number,
  ): Promise<Map<string, CatalogBookCardDto>> {
    const books = await this.repo.findBooksByIds(ids, languageId);
    return new Map<string, CatalogBookCardDto>(
      books.map((book): [string, CatalogBookCardDto] => [
        book.id.toString(),
        this.toBookCard(book),
      ]),
    );
  }

  private async buildCardVariantMap(
    ids: bigint[],
    languageId: number,
  ): Promise<Map<string, CatalogBookCardDto>> {
    const variants = await this.repo.findBooksVariantByIds(
      ids,
      languageId,
      ids.length,
    );
    return new Map<string, CatalogBookCardDto>(
      variants.map((variant): [string, CatalogBookCardDto] => [
        variant.id.toString(),
        this.toVariantBookCard(variant),
      ]),
    );
  }

  private buildCategoryTree(rows: CategoryRow[]): CatalogCategoryTreeDto[] {
    const nodes = new Map<string, CatalogCategoryTreeDto>();

    for (const row of rows) {
      const translation = row.categoryTranslation?.[0];
      if (!translation?.name) continue;

      const id = row.id.toString();
      nodes.set(id, {
        id,
        parentId: row.parentId ? row.parentId.toString() : null,
        name: translation.name,
        slug: translation.slug ?? null,
        sortOrder: row.sortOrder ?? 0,
        children: [],
      });
    }

    const roots: CatalogCategoryTreeDto[] = [];
    for (const node of nodes.values()) {
      if (!node.parentId) {
        roots.push(node);
        continue;
      }

      const parent = nodes.get(node.parentId);
      if (!parent) continue;
      parent.children.push(node);
    }

    this.sortCategoryTree(roots);
    return roots;
  }

  private sortCategoryTree(nodes: CatalogCategoryTreeDto[]): void {
    nodes.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.id.localeCompare(b.id);
    });

    for (const node of nodes) {
      this.sortCategoryTree(node.children);
    }
  }

  async listBooks(
    query: CatalogBookListQueryDto,
    langId: number,
  ): Promise<CatalogBookListResponseDto> {
    const { page, limit } = getPaginationParams(query.page, query.limit);
    const slugCategory = query.slugCategory?.trim();
    const cacheKey = `catalog:books:langId=${langId}:p${page}:l${limit}`;

    if (slugCategory) {
      return this.withCache(
        `${cacheKey}:cat=${slugCategory}`,
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
            this.toListBookCard(book),
          );

          return buildPaginatedResult(items, total, page, limit);
        },
      );
    }

    return this.withCache(cacheKey, LIST_CACHE_TTL, async () => {
      const [total, rows] = await Promise.all([
        this.repo.countBooksForList(langId),
        this.repo.findBooksForList(langId, page, limit),
      ]);

      const items: CatalogBookCardDto[] = rows.map((book) =>
        this.toListBookCard(book),
      );

      return buildPaginatedResult(items, total, page, limit);
    });
  }

  async queryListBook(
    query: CatalogBookListQueryDto,
    ids: bigint[],
    langId: number,
  ): Promise<CatalogBookListResponseDto> {
    const { page, limit } = getPaginationParams(query.page, query.limit);

    const [total, rows] = await Promise.all([
      this.repo.countBooksForList(langId),
      this.repo.findBooksByIds(ids, langId, page, limit),
    ]);

    const items: CatalogBookCardDto[] = rows.map((book) => {
      const translation = book.translations[0];
      const cheapestVariant = book.variants[0];
      const stock = cheapestVariant?.stock ?? 0;

      return {
        id: book.id.toString(),
        title: translation?.title ?? `Book ${book.id.toString()}`,
        slug: translation?.slug ?? null,
        coverImageUrl: book.coverImageUrl ?? null,
        price: cheapestVariant
          ? Number(cheapestVariant.price).toFixed(2)
          : null,
        currencyCode: cheapestVariant?.currencyCode ?? null,
        isOutOfStock: !cheapestVariant || stock <= 0,
        createdAt: book.createdAt,
        bookVariantId: cheapestVariant?.id,
        categories: this.toListBookCategories(book.categories ?? []),
      };
    });

    return buildPaginatedResult(items, total, page, limit);
  }

  async getBookDetail(
    bookId: bigint,
    langId: number,
  ): Promise<CatalogBookDetailDto> {
    const cacheKey = `catalog:detail:${bookId.toString()}:${langId}`;

    return this.withCache(cacheKey, DETAIL_CACHE_TTL, async () => {
      const book = await this.repo.findBookDetailById(bookId, langId);
      if (!book) throw new NotFoundException(CatalogMessage.BOOK_NOT_FOUND);
      return this.toBookDetail(book);
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

    const cacheKey = `catalog:detail:slug:${normalizedSlug}:${langId}`;

    return this.withCache(cacheKey, DETAIL_CACHE_TTL, async () => {
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
      return this.toBookDetail(book, normalizedSlug, recommend);
    });
  }

  // Thuật toán độ tương đồng Jaccard (Intersection over Union)
  calculateJaccard(
    currentCategories: bigint[],
    targetCategories: bigint[],
  ): number {
    const setA = new Set(currentCategories);
    const setB = new Set(targetCategories);

    // Tìm phần giao (Intersection) (xem giống nhau bao nhiêu)
    const intersection = new Set([...setA].filter((x) => setB.has(x)));

    // Tìm phần hợp (Union) (lọc ra các trùm lặp)
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
  }

  private toListBookCategories(
    bookCategories: BookListRow['categories'],
  ): CatalogCategoryDto[] {
    return (bookCategories ?? []).map((x) => {
      const category = x.category;
      const translation = category.categoryTranslation?.[0];

      return {
        id: category.id.toString(),
        parentId: category.parentId ? category.parentId.toString() : null,
        sortOrder: category.sortOrder ?? 0,
        name: translation?.name ?? `Category ${category.id.toString()}`,
        slug: translation?.slug ?? null,
      };
    });
  }

  private toListBookCard(book: BookListRow): CatalogBookCardDto {
    const translation = book.translations[0];
    const cheapestVariant = book.variants[0];
    const stock = cheapestVariant?.stock ?? 0;

    return {
      id: book.id.toString(),
      title: translation?.title ?? `Book ${book.id.toString()}`,
      slug: translation?.slug ?? null,
      coverImageUrl: book.coverImageUrl ?? null,
      price: cheapestVariant ? Number(cheapestVariant.price).toFixed(2) : null,
      currencyCode: cheapestVariant?.currencyCode ?? null,
      isOutOfStock: !cheapestVariant || stock <= 0,
      createdAt: book.createdAt,
      bookVariantId: cheapestVariant?.id,
      format: cheapestVariant?.format ?? null,
      categories: this.toListBookCategories(book.categories ?? []),
      badges: (book.bookBadge ?? []).map((badge) => badge.code),
    };
  }

  private toBookDetail(
    book: BookDetailByIdRow,
    slugFallback?: string,
    recommend?: CatalogBookCardDto[],
  ): CatalogBookDetailDto {
    const t = book.translations[0];

    return {
      id: book.id.toString(),
      title: t?.title ?? `Book ${book.id.toString()}`,
      slug: t?.slug ?? slugFallback ?? null,
      description: t?.description ?? null,
      coverImageUrl: book.coverImageUrl ?? null,
      publicationYear: book.publicationYear ?? null,
      pageCount: book.pageCount ?? null,
      weightGrams: book.weightGrams ?? null,
      publisherName: book.publisher?.defaultName ?? null,
      ratingAvg: book.ratingAvg,
      ratingCount: book.ratingCount,
      variants: this.toBookVariants(book),
      categories: this.toBookCategories(book),
      specs: this.toBookSpecs(book),
      badges: this.toBookBadges(book),
      createdAt: book.createdAt,
      recommend: recommend ?? [],
    };
  }

  private toBookCategories(book: BookDetailByIdRow): CatalogCategoryDto[] {
    return (book.categories ?? []).map((x) => {
      const c = x.category;
      const ct = c.categoryTranslation?.[0];
      return {
        id: c.id.toString(),
        parentId: c.parentId ? c.parentId.toString() : null,
        sortOrder: c.sortOrder ?? null,
        name: ct?.name ?? null,
        slug: ct?.slug ?? null,
      };
    });
  }

  private toBookVariants(book: BookDetailByIdRow): CatalogBookVariantDto[] {
    return (book.variants ?? []).map((v) => ({
      id: v.id.toString(),
      format: v.format,
      edition: v.edition ?? null,
      isbn: v.isbn ?? null,
      price: v.price?.toString?.() ?? String(v.price),
      currencyCode: v.currencyCode ?? null,
      available: v.available ?? null,
    }));
  }

  private toBookSpecs(book: BookDetailByIdRow): CatalogBookSpecDto {
    const specs = book.specs;
    if (!specs) {
      return {};
    }

    return {
      widthCm: this.toNullableString(specs.widthCm),
      heightCm: this.toNullableString(specs.heightCm),
      thicknessCm: this.toNullableString(specs.thicknessCm),
      packaging: specs.packaging ?? null,
    };
  }

  private toBookBadges(book: BookDetailByIdRow): Badge[] {
    return (book.bookBadge ?? []).map((badge) => badge.code);
  }

  private toNullableString(
    value: { toString: () => string } | null | undefined,
  ): string | null {
    if (!value) {
      return null;
    }
    return value.toString();
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
    ids: bigint[],
    map: Map<string, CatalogBookCardDto>,
  ): CatalogBookCardDto[] {
    return ids
      .map((id) => map.get(id.toString()))
      .filter((x) => x != undefined && x != null);
  }

  private toBookCard(
    book: Awaited<ReturnType<CatalogRepository['findBooksByIds']>>[number],
    soldCount?: number,
    ratingAvg?: number,
    ratingCount?: number,
  ): CatalogBookCardDto {
    const t = book.translations[0];
    const cheapestVariant = book.variants[0];
    return {
      id: book.id.toString(),
      title: t?.title ?? `Book ${book.id.toString()}`,
      slug: t?.slug ?? null,
      coverImageUrl: book.coverImageUrl,
      ratingAvg: ratingAvg ?? null,
      ratingCount: ratingCount ?? 0,
      soldCount: soldCount ?? 0,
      createdAt: book.createdAt,
      badges: (book.bookBadge ?? []).map((badge) => badge.code),
      bookVariantId: cheapestVariant?.id,
      price: cheapestVariant ? Number(cheapestVariant.price).toFixed(2) : null,
      currencyCode: cheapestVariant?.currencyCode ?? null,
      format: cheapestVariant?.format ?? null,
      isOutOfStock: !cheapestVariant || (cheapestVariant.stock ?? 0) <= 0,
    };
  }

  private toVariantBookCard(
    variant: Awaited<
      ReturnType<CatalogRepository['findBooksVariantByIds']>
    >[number],
    soldCount?: number,
    ratingAvg?: number,
    ratingCount?: number,
  ): CatalogBookCardDto {
    const book = variant.book;
    const t = book.translations[0];
    const price = Number.isFinite(Number(variant.price))
      ? Number(variant.price).toFixed(2)
      : null;

    return {
      id: book.id.toString(),
      title: t?.title ?? `Book ${book.id.toString()}`,
      slug: t?.slug ?? null,
      coverImageUrl: book.coverImageUrl,
      price: price,
      currencyCode: variant.currencyCode ?? null,
      ratingAvg: ratingAvg ?? null,
      ratingCount: ratingCount ?? 0,
      soldCount: soldCount ?? 0,
      createdAt: book.createdAt,
      badges: (book.bookBadge ?? []).map((badge) => badge.code),
      bookVariantId: variant.id,
      format: variant.format,
      isOutOfStock: (variant.stock ?? 0) <= 0,
    };
  }

  // Build unique mục đính trùng lọc trùng id tối ưu query nhanh
  private uniqueBigIntIds(ids: bigint[]): bigint[] {
    return [...new Map(ids.map((id) => [id.toString(), id])).values()];
  }
}
