import { AuthorMessage } from '@/common';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BookAuthorService } from '../book/author/service/book-author.service';
import { AuthorRepository } from './author.repository';
import { CreateAuthorRequestDto } from './dto/request/create-author.request.dto';
import { GetAuthorBooksQueryDto } from './dto/request/get-author-books.query.dto';
import { GetAuthorsQueryDto } from './dto/request/get-authors.query.dto';
import { AuthorBookItemResponseDto } from './dto/response/author-book-item.response.dto';
import { AuthorBookListResponseDto } from './dto/response/author-book-list.response.dto';
import { AuthorItemResponseDto } from './dto/response/author-item.response.dto';
import { AuthorListResponseDto } from './dto/response/author-list.response.dto';

@Injectable()
export class AuthorService {
  constructor(
    private readonly authorRepository: AuthorRepository,
    private readonly bookAuthorService: BookAuthorService,
  ) { }

  async createAuthor(
    body: CreateAuthorRequestDto,
  ): Promise<AuthorItemResponseDto> {
    const created = await this.authorRepository.createAuthor(body.defaultName);
    return {
      id: created.id.toString(),
      name: created.defaultName,
    };
  }

  async createAuthorMany(
    defaultNames: string[],
  ): Promise<AuthorItemResponseDto[]> {
    const normalizedNames = Array.from(
      new Map(
        (defaultNames ?? [])
          .map((name) => name.trim())
          .filter((name) => name.length > 0)
          .map((name) => [name.toLowerCase(), name]),
      ).values(),
    );

    if (normalizedNames.length === 0) {
      return [];
    }

    const createdAuthors = await Promise.all(
      normalizedNames.map((name) => this.authorRepository.createAuthor(name)),
    );

    return createdAuthors.map((author) => ({
      id: author.id.toString(),
      name: author.defaultName,
    }));
  }

  async getAuthors(
    query: GetAuthorsQueryDto,
    langId: number,
  ): Promise<AuthorListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.authorRepository.countAuthors(),
      this.authorRepository.findAuthors(langId, page, limit),
    ]);

    const items: AuthorItemResponseDto[] = rows.map((row) => ({
      id: row.id.toString(),
      name: row.defaultName,
    }));

    return buildPaginatedResult(items, total, page, limit);
  }

  async getAuthorBooks(
    authorId: bigint,
    query: GetAuthorBooksQueryDto,
    langId: number,
  ): Promise<AuthorBookListResponseDto> {
    const exists = await this.authorRepository.existsById(authorId);
    if (!exists) {
      throw new NotFoundException(AuthorMessage.AUTHOR_NOT_FOUND);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.bookAuthorService.countBooksByAuthor(authorId, langId),
      this.bookAuthorService.findBooksByAuthor(authorId, langId, page, limit),
    ]);

    const items: AuthorBookItemResponseDto[] = rows.map((row) => {
      const book = row.book;
      const translation = book.translations[0];
      const cheapest = book.variants[0];

      return {
        bookId: book.id.toString(),
        title: translation?.title ?? `Book ${book.id.toString()}`,
        slug: translation?.slug ?? null,
        minPrice: cheapest ? Number(cheapest.price).toFixed(2) : null,
        coverImageUrl: book.coverImageUrl ?? null,
        isPrimary: row.isPrimary,
      };
    });

    return buildPaginatedResult(items, total, page, limit);
  }
}
