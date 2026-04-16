import { PrismaService } from '@/database';
import { UpdateAdminBookVariantRequestDto } from '@/modules/admin/dto/request';
import {
  CreateBookSpecDto,
  CreateBookVariantDto,
} from '@/modules/admin/dto/request/create-admin-book-all.request.dto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  adminBookDetailSelect,
  adminBookSelect,
  adminBookSnapshotSelect,
  adminBookTranslationCreateSelect,
  buildAdminBookListSelect,
} from './select';

type DbClient = Prisma.TransactionClient | PrismaService;

export type CreateAdminBookParams = {
  publisherId?: bigint;
  publicationYear?: number;
  pageCount?: number;
  weightGrams?: number;
  coverImageUrl?: string;
  actorUserId: bigint;
  supplerId: bigint;
};

export type UpdateAdminBookTranslationParams = {
  languageId: number;
  title?: string;
  description?: string;
};

export type UpdateAdminBookMain = {
  pageCount?: number;
  weightGrams?: number;
  coverImageUrl?: string;
  isActive?: boolean;
};

export type CreateAdminBookTranslationParams = {
  bookId: bigint;
  languageId: number;
  title: string;
  description?: string;
  slug: string;
};

export type CreateBookAuthorLinkInput = {
  authorId: bigint;
  isPrimary?: boolean;
};

@Injectable()
export class AdminBookRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublisherById(publisherId: bigint) {
    return this.prisma.publisher.findUnique({
      where: { id: publisherId },
      select: { id: true },
    });
  }

  createBook(params: CreateAdminBookParams, tx?: Prisma.TransactionClient) {
    const db: DbClient = tx ?? this.prisma;

    return db.book.create({
      data: {
        publisherId: params.publisherId,
        publicationYear: params.publicationYear ?? null,
        pageCount: params.pageCount ?? null,
        weightGrams: params.weightGrams ?? null,
        coverImageUrl: params.coverImageUrl ?? null,
        isActive: false,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
      },
      select: adminBookSelect,
    });
  }

  createBookAuthor(
    bookId: bigint,
    body: CreateBookAuthorLinkInput,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;
    return db.bookAuthor.create({
      data: {
        bookId: bookId,
        authorId: body.authorId,
        isPrimary: body.isPrimary,
      },
    });
  }

  createVariantById(
    bookId: bigint,
    body: CreateBookVariantDto,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;
    return db.bookVariant.create({
      data: {
        bookId: bookId,
        format: body.format,
        edition: body.edition,
        isbn: body.isbn,
        price: body.price,
        currencyCode: body.currencyCode,
        isActive: body.isActive,
      },
    });
  }

  createBookSpecById(
    bookId: bigint,
    body: CreateBookSpecDto,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;
    return db.bookSpec.create({
      data: {
        bookId: bookId,
        widthCm: body.widthCm,
        heightCm: body.heightCm,
        packaging: body.packaging,
        thicknessCm: body.thicknessCm,
      },
    });
  }

  createBookAuthors(
    bookId: bigint,
    bodies: CreateBookAuthorLinkInput[],
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;
    const data: Prisma.BookAuthorCreateManyInput[] = (bodies ?? []).map(
      (body) => ({
        bookId,
        authorId: body.authorId,
        isPrimary: body.isPrimary ?? false,
      }),
    );
    if (data.length === 0) return Promise.resolve({ count: 0 });
    return db.bookAuthor.createMany({ data, skipDuplicates: true });
  }

  createVariantsByBookId(
    bookId: bigint,
    bodies: CreateBookVariantDto[],
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;
    const data: Prisma.BookVariantCreateManyInput[] = (bodies ?? []).map(
      (body) => ({
        bookId,
        format: body.format,
        edition: body.edition ?? null,
        isbn: body.isbn ?? null,
        price: body.price as any,
        currencyCode: body.currencyCode ?? null,
        isActive: body.isActive ?? true,
      }),
    );
    if (data.length === 0) return Promise.resolve({ count: 0 });
    return db.bookVariant.createMany({ data, skipDuplicates: true });
  }

  createBookSpecsById(
    bookId: bigint,
    body: CreateBookSpecDto,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;
    return db.bookSpec.upsert({
      where: { bookId },
      create: {
        bookId,
        widthCm: body.widthCm ?? null,
        heightCm: body.heightCm ?? null,
        thicknessCm: body.thicknessCm ?? null,
        packaging: body.packaging ?? null,
      },
      update: {
        widthCm: body.widthCm ?? null,
        heightCm: body.heightCm ?? null,
        thicknessCm: body.thicknessCm ?? null,
        packaging: body.packaging ?? null,
      },
    });
  }

  findBookById(bookId: bigint, tx?: Prisma.TransactionClient) {
    const db: DbClient = tx ?? this.prisma;
    return db.book.findFirst({
      where: { id: bookId },
      select: adminBookSelect,
    });
  }

  findBookDetailById(bookId: bigint, tx?: Prisma.TransactionClient) {
    const db: DbClient = tx ?? this.prisma;

    return db.book.findFirst({
      where: { id: bookId },
      select: adminBookDetailSelect,
    });
  }

  updateBook(
    bookId: bigint,
    params: UpdateAdminBookMain,
    actorUserId: bigint,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;
    const data: Prisma.BookUncheckedUpdateInput = {
      updatedBy: actorUserId,
    };

    return db.book.update({
      where: { id: bookId },
      data: { ...params, ...data },
      select: adminBookSelect,
    });
  }

  updateTranslationBook(
    bookId: bigint,
    params: UpdateAdminBookTranslationParams,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;

    return db.bookTranslation.update({
      where: {
        bookId_languageId: {
          bookId,
          languageId: params.languageId,
        },
      },
      data: {
        title: params.title,
        description: params.description,
      },
    });
  }

  updateVariantById(
    bookId: bigint,
    variants: UpdateAdminBookVariantRequestDto[],
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;
    return Promise.all(
      variants.map((variant) => {
        console.log('variant before update =', variant);
        return db.bookVariant.update({
          where: { id: variant.id },
          data: {
            price: variant.price,
            isActive: variant.isActive,
          },
        });
      }),
    );
  }

  softDeleteBook(
    bookId: bigint,
    actorUserId: bigint,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;

    return db.book.update({
      where: { id: bookId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        updatedBy: actorUserId,
      },
      select: adminBookSelect,
    });
  }

  private buildBookListWhere(
    languageId: number,
    searchPhrase?: string,
  ): Prisma.BookWhereInput {
    return {
      deletedAt: null,
      ...(searchPhrase
        ? {
            translations: {
              some: {
                languageId,
                title: {
                  contains: searchPhrase,
                },
              },
            },
          }
        : {}),
    };
  }

  countBooks(languageId: number, searchPhrase?: string) {
    return this.prisma.book.count({
      where: this.buildBookListWhere(languageId, searchPhrase),
    });
  }

  countTotalBooks() {
    return this.prisma.book.count({
      where: {
        deletedAt: null,
      },
    });
  }

  countActiveBooks() {
    return this.prisma.book.count({
      where: {
        deletedAt: null,
        isActive: true,
      },
    });
  }

  countAuthors() {
    return this.prisma.author.count();
  }

  countPublishers() {
    return this.prisma.publisher.count();
  }

  findBooks(
    page: number,
    limit: number,
    languageId: number,
    searchPhrase?: string,
  ) {
    return this.prisma.book.findMany({
      where: this.buildBookListWhere(languageId, searchPhrase),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: buildAdminBookListSelect(languageId),
    });
  }

  findBookTranslationByBookIdAndLanguage(
    bookId: bigint,
    languageId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;

    return db.bookTranslation.findFirst({
      where: {
        bookId,
        languageId,
      },
      select: {
        id: true,
      },
    });
  }

  findBookTranslationByLanguageAndSlug(
    languageId: number,
    slug: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;

    return db.bookTranslation.findFirst({
      where: {
        languageId,
        slug,
      },
      select: {
        id: true,
      },
    });
  }

  createBookTranslation(
    params: CreateAdminBookTranslationParams,
    tx?: Prisma.TransactionClient,
  ) {
    const db: DbClient = tx ?? this.prisma;

    return db.bookTranslation.create({
      data: {
        bookId: params.bookId,
        languageId: params.languageId,
        title: params.title,
        description: params.description,
        slug: params.slug,
      },
      select: adminBookTranslationCreateSelect,
    });
  }

  countBookSnapshots() {
    return this.prisma.bookVariantSnapshot.count();
  }

  findBookSnapshots(page: number, limit: number) {
    return this.prisma.bookVariantSnapshot.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: adminBookSnapshotSelect,
    });
  }
}
