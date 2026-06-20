import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  adminBookVariantSnapshotSelect,
  adminBookVariantTranslationCreateSelect,
  buildAdminBookVariantListSelect,
} from './select';

type DbClient = Prisma.TransactionClient | PrismaService;

export type CreateAdminBookParams = {
  publisherId?: number;
  publicationYear?: number;
  pageCount?: number;
  weightGrams?: number;
  coverImageUrl?: string;
  actorUserId: number;
  supplerId: number;
};

export type UpdateAdminBookParams = {
  publisherId?: number;
  publicationYear?: number;
  pageCount?: number;
  weightGrams?: number;
  coverImageUrl?: string;
  isActive?: boolean;
};

export type CreateAdminBookTranslationParams = {
  bookId: number;
  languageId: number;
  title: string;
  description?: string;
  slug: string;
};

export type CreateBookAuthorLinkInput = {
  authorId: number;
  isPrimary?: boolean;
};

@Injectable()
export class AdminBookVariantsRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  countBookVariants(languageId: number, searchPhrase?: string) {
    return this.prisma.bookVariant.count({
      where: {
        book: this.buildBookListWhere(languageId, searchPhrase),
      },
    });
  }
  findBookVariants(
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
      select: buildAdminBookVariantListSelect(languageId),
    });
  }

  findBookTranslationByBookIdAndLanguage(
    bookId: number,
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
      select: adminBookVariantTranslationCreateSelect,
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
      select: adminBookVariantSnapshotSelect,
    });
  }
}
