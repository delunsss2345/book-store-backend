import { AdminBookMessage } from '@/common';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { PrismaService } from '@/database';
import { AdminBookVariantsService } from '@/modules/admin/book-variant/admin-book-variant.service';
import { AdminBookDetailResponseDto } from '@/modules/admin/dto/response/admin-book-detail.response.dto';
import { AdminBookItemUpdateResponseDto } from '@/modules/admin/dto/response/admin-book-update.response.dto';
import { AuditLogService } from '@/modules/audit-log/service/audit-log.service';
import { AuthorService } from '@/modules/author/service/author.service';
import { LanguageService } from '@/modules/language/service/language.service';
import { PublisherService } from '@/modules/publisher/service/publisher.service';
import { generateSlug } from '@/utils/generateSlug.util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Cache } from 'cache-manager';
import {
  AdminBookListQueryDto,
  AdminBookSnapshotListQueryDto,
  CreateAdminBookRequestDto,
  CreateAdminBookTranslationRequestDto,
  UpdateAdminBookRequestDto,
} from '../dto/request';
import {
  AdminBookItemResponseDto,
  AdminBookListDetailItemResponseDto,
  AdminBookListDetailResponseDto,
  AdminBookListResponseDto,
  AdminBookSnapshotListResponseDto,
  AdminBookStatsResponseDto,
  AdminBookTranslationResponseDto,
} from '../dto/response';
import {
  AdminBookRepository,
  CreateBookAuthorLinkInput,
} from './admin-book.repository';
import {
  toAdminBookItem,
  toBookDetail,
  toMapperUpdateBook,
  toSnapshotItem
} from './mapper';

const ADMIN_STATS_CACHE_KEY = 'admin:stats';
const ADMIN_STATS_CACHE_TTL = 86_400_000;

@Injectable()
export class AdminBookService {
  constructor(
    private readonly adminBookRepository: AdminBookRepository,
    private readonly adminBookVariantsService: AdminBookVariantsService,
    private readonly languageService: LanguageService,
    private readonly auditLogService: AuditLogService,
    private readonly publisherService: PublisherService,
    private readonly authorService: AuthorService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  async getDetail(bookId: number): Promise<AdminBookDetailResponseDto> {
    const book = await this.adminBookRepository.findBookById(bookId);
    if (!book || book.deletedAt) {
      throw new NotFoundException(AdminBookMessage.BOOK_NOT_FOUND);
    }
    return toBookDetail(book);
  }
  async createBook(
    body: CreateAdminBookRequestDto,
    langId: number,
    actorUserId: number,
    ip?: string,
  ) {
    const normalizedPublisherName = body.publisherName?.trim();
    if (!normalizedPublisherName) {
      throw new BadRequestException(AdminBookMessage.PUBLISHER_NAME_REQUIRED);
    }

    const publisher = await this.publisherService.createPublisher({
      defaultName: normalizedPublisherName,
    });
    const publisherId = this.parsePublisherId(publisher.id);
    if (!publisherId) {
      throw new BadRequestException(AdminBookMessage.INVALID_PUBLISHER_ID);
    }

    const normalizedAuthorMap = new Map<string, { name: string; isPrimary: boolean }>();
    for (const author of body.authors ?? []) {
      const normalizedAuthorName = author.authorName?.trim();
      if (!normalizedAuthorName) continue;
      const key = normalizedAuthorName.toLowerCase();
      const existed = normalizedAuthorMap.get(key);
      if (existed) {
        existed.isPrimary = existed.isPrimary || Boolean(author.isPrimary);
        continue;
      }
      normalizedAuthorMap.set(key, {
        name: normalizedAuthorName,
        isPrimary: Boolean(author.isPrimary),
      });
    }

    const normalizedAuthors = Array.from(normalizedAuthorMap.values());
    let bookAuthorsPayload: CreateBookAuthorLinkInput[] = [];

    if (normalizedAuthors.length > 0) {
      const createdAuthors = await this.authorService.createAuthorMany(
        normalizedAuthors.map((a) => a.name),
      );
      const authorIdByName = new Map<string, number>(
        createdAuthors.map((a) => [a.name.trim().toLowerCase(), Number(a.id)]),
      );
      bookAuthorsPayload = normalizedAuthors.reduce<CreateBookAuthorLinkInput[]>((acc, author) => {
        const authorId = authorIdByName.get(author.name.toLowerCase());
        if (!authorId) return acc;
        acc.push({ authorId, isPrimary: author.isPrimary });
        return acc;
      }, []);
    }

    return this.prisma.$transaction(async (tx) => {
      const createdBook = await this.adminBookRepository.createBook(
        {
          publisherId,
          pageCount: body.pageCount,
          coverImageUrl: body.coverImageUrl,
          actorUserId,
        },
        tx,
      );

      const baseSlug = generateSlug(body.title) || `book-${createdBook.id.toString()}`;
      const slug = await this.buildUniqueSlug(langId, baseSlug, tx);

      const createTasks: Promise<unknown>[] = [
        this.adminBookRepository.createBookTranslation(
          {
            bookId: createdBook.id,
            languageId: langId,
            title: body.title,
            description: body.description,
            slug,
          },
          tx,
        ),
      ];

      if (bookAuthorsPayload.length > 0) {
        createTasks.push(
          this.adminBookRepository.createBookAuthors(createdBook.id, bookAuthorsPayload, tx),
        );
      }

      await Promise.all(createTasks);

      if (body.spec) {
        await this.adminBookRepository.createBookSpecById(createdBook.id, body.spec, tx);
      }

      if (body.bookVariantItems?.length) {
        await this.adminBookVariantsService.createVariants(
          createdBook.id,
          body.bookVariantItems,
          tx,
        );
      }

      const newBook = await this.adminBookRepository.findBookById(createdBook.id, tx);
      return toAdminBookItem(newBook!);
    });
  }

  async createBookTranslation(
    bookId: number,
    body: CreateAdminBookTranslationRequestDto,
    actorUserId: number,
    ip?: string,
  ): Promise<AdminBookTranslationResponseDto> {
    const language = await this.languageService.resolveLanguage(body.lang);

    return this.prisma.$transaction(async (tx) => {
      const book = await this.adminBookRepository.findBookById(bookId, tx);
      if (!book || book.deletedAt) {
        throw new NotFoundException(AdminBookMessage.BOOK_NOT_FOUND);
      }

      const existed =
        await this.adminBookRepository.findBookTranslationByBookIdAndLanguage(
          bookId,
          language.id,
          tx,
        );

      if (existed) {
        throw new ConflictException(
          AdminBookMessage.BOOK_TRANSLATION_ALREADY_EXISTS_IN_THIS_LANGUAGE,
        );
      }

      const baseSlug = generateSlug(body.title) || `book-${bookId.toString()}`;
      const slug = await this.buildUniqueSlug(language.id, baseSlug, tx);

      const created = await this.adminBookRepository.createBookTranslation(
        {
          bookId,
          languageId: language.id,
          title: body.title,
          description: body.description,
          slug,
        },
        tx,
      );

      const response: AdminBookTranslationResponseDto = {
        id: created.id.toString(),
        languageId: created.languageId,
        title: created.title,
        description: created.description ?? null,
        slug: created.slug ?? slug,
      };

      await this.auditLogService.createAuditLog(
        {
          actorUserId,
          action: 'ADMIN_BOOK_TRANSLATION_CREATE',
          entityType: 'BOOK_TRANSLATION',
          entityId: response.id,
          before: null,
          after: response as unknown as Prisma.InputJsonValue,
          ip,
        },
        tx,
      );

      return response;
    });
  }

  async updateBook(
    bookId: number,
    body: UpdateAdminBookRequestDto,
    actorUserId: number,
    ip?: string,
  ): Promise<AdminBookItemUpdateResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const before = await this.adminBookRepository.findBookById(bookId, tx);
      if (!before || before.deletedAt) {
        throw new NotFoundException(AdminBookMessage.BOOK_NOT_FOUND);
      }

      if (body.translations) {
        for (const translation of body.translations) {
          await this.adminBookRepository.updateTranslationBook(
            bookId,
            {
              languageId: translation.languageId,
              title: translation.title,
              description: translation.description,
            },
            tx,
          );
        }
      }
      if (body.variants) {
        for (const variant of body.variants) {
          if (variant.price < variant.costPrice) {
            throw new BadRequestException(
              AdminBookMessage.VARIANT_PRICE_CANNOT_BE_LESS_THAN_COST_PRICE,
            );
          }
        }
        await this.adminBookRepository.updateVariantById(
          bookId,
          body.variants,
          tx,
        );
      }

      const updatedBook = await this.adminBookRepository.updateBook(
        bookId,
        {
          pageCount: body.pageCount,
          weightGrams: body.weightGrams,
          coverImageUrl: body.coverImageUrl,
          isActive: body.isActive,
        },
        actorUserId,
        tx,
      );

      await this.auditLogService.createAuditLog(
        {
          actorUserId,
          action: 'ADMIN_BOOK_UPDATE',
          entityType: 'BOOK',
          entityId: String(updatedBook.id),
          before,
          after: updatedBook as unknown as Prisma.InputJsonValue,
          ip,
        },
        tx,
      );
      console.log(updatedBook);
      return toMapperUpdateBook(updatedBook);
    });
  }

  async deleteBook(
    bookId: number,
    actorUserId: number,
    ip?: string,
  ): Promise<AdminBookItemResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const before = await this.adminBookRepository.findBookById(bookId, tx);
      if (!before || before.deletedAt) {
        throw new NotFoundException(AdminBookMessage.BOOK_NOT_FOUND);
      }

      let updated: Awaited<ReturnType<AdminBookRepository['softDeleteBook']>>;
      try {
        updated = await this.adminBookRepository.softDeleteBook(
          bookId,
          actorUserId,
          tx,
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException(AdminBookMessage.BOOK_NOT_FOUND);
        }

        throw error;
      }

      const beforeMapped = toAdminBookItem(before);
      const afterMapped = toAdminBookItem(updated);

      await this.auditLogService.createAuditLog(
        {
          actorUserId,
          action: 'ADMIN_BOOK_DELETE',
          entityType: 'BOOK',
          entityId: afterMapped.id,
          before: beforeMapped as unknown as Prisma.InputJsonValue,
          after: afterMapped as unknown as Prisma.InputJsonValue,
          ip,
        },
        tx,
      );

      return afterMapped;
    });
  }

  async getBooks(
    query: AdminBookListQueryDto,
    langId: number,
  ): Promise<AdminBookListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const searchPhrase = query.searchPhrase;

    const [total, rows] = await Promise.all([
      this.adminBookRepository.countBooks(langId, searchPhrase),
      this.adminBookRepository.findBooks(page, limit, langId, searchPhrase),
    ]);
    console.log(rows);

    return buildPaginatedResult(
      rows,
      total,
      page,
      limit,
    );
  }

  async listBooks(
    query: AdminBookListQueryDto,
    langId: number,
  ): Promise<AdminBookListDetailResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const searchPhrase = query.searchPhrase;
    if (!searchPhrase) return buildPaginatedResult([], 0, page, limit);

    const [total, rows] = await Promise.all([
      this.adminBookRepository.countBooksDetailed(langId, searchPhrase),
      this.adminBookRepository.findBooksDetailed(page, limit, langId, searchPhrase),
    ]);

    const items: AdminBookListDetailItemResponseDto[] = rows.map((row) => {
      const translation = row.translations[0];
      return {
        id: row.id.toString(),
        title: translation?.title ?? '',
        description: translation?.description ?? null,
        slug: translation?.slug ?? null,
        authors: row.authors
          .map((ba) => ba.author.defaultName)
          .join(', '),
        isActive: row.isActive,
        coverImageUrl: row.coverImageUrl ?? null,
        spec: row.specs
          ? {
            widthCm: row.specs.widthCm ? Number(row.specs.widthCm) : null,
            heightCm: row.specs.heightCm ? Number(row.specs.heightCm) : null,
            thicknessCm: row.specs.thicknessCm ? Number(row.specs.thicknessCm) : null,
            packaging: row.specs.packaging ?? null,
          }
          : null,
      };
    });

    return buildPaginatedResult(items, total, page, limit);
  }

  async getStats(): Promise<AdminBookStatsResponseDto> {
    const cached = await this.cacheManager.get<AdminBookStatsResponseDto>(
      ADMIN_STATS_CACHE_KEY,
    );
    if (cached) {
      return cached;
    }

    const [totalBooks, activeBooks, totalAuthors, totalPublishers] =
      await Promise.all([
        this.adminBookRepository.countTotalBooks(),
        this.adminBookRepository.countActiveBooks(),
        this.adminBookRepository.countAuthors(),
        this.adminBookRepository.countPublishers(),
      ]);

    const response: AdminBookStatsResponseDto = {
      totalBooks,
      activeBooks,
      totalAuthors,
      totalPublishers,
    };

    await this.cacheManager.set(
      ADMIN_STATS_CACHE_KEY,
      response,
      ADMIN_STATS_CACHE_TTL,
    );

    return response;
  }

  async getBookSnapshots(
    query: AdminBookSnapshotListQueryDto,
  ): Promise<AdminBookSnapshotListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.adminBookRepository.countBookSnapshots(),
      this.adminBookRepository.findBookSnapshots(page, limit),
    ]);

    return buildPaginatedResult(
      rows.map((row) => toSnapshotItem(row)),
      total,
      page,
      limit,
    );
  }

  private parsePublisherId(value?: string): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    return Number(value);
  }

  private async buildUniqueSlug(
    languageId: number,
    baseSlug: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    let candidate = baseSlug;
    let index = 2;

    while (true) {
      const existed =
        await this.adminBookRepository.findBookTranslationByLanguageAndSlug(
          languageId,
          candidate,
          tx,
        );

      if (!existed) {
        return candidate;
      }

      candidate = `${baseSlug}-${index}`;
      index += 1;
    }
  }
}
