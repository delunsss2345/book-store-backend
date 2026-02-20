import { Injectable, NotFoundException } from '@nestjs/common';
import { BookAuthorService } from '../book-author/book-author.service';
import { CreateAuthorRequestDto } from './dto/request/create-author.request.dto';
import { GetAuthorBooksQueryDto } from './dto/request/get-author-books.query.dto';
import { GetAuthorsQueryDto } from './dto/request/get-authors.query.dto';
import { AuthorBookItemResponseDto } from './dto/response/author-book-item.response.dto';
import { AuthorBookListResponseDto } from './dto/response/author-book-list.response.dto';
import { AuthorItemResponseDto } from './dto/response/author-item.response.dto';
import { AuthorListResponseDto } from './dto/response/author-list.response.dto';
import { AuthorRepository } from './author.repository';

@Injectable()
export class AuthorService {
    constructor(
        private readonly authorRepository: AuthorRepository,
        private readonly bookAuthorService: BookAuthorService,
    ) { }

    async createAuthor(body: CreateAuthorRequestDto): Promise<AuthorItemResponseDto> {
        const created = await this.authorRepository.createAuthor(body.defaultName);
        return {
            id: created.id.toString(),
            name: created.defaultName,
        };
    }

    async getAuthors(query: GetAuthorsQueryDto): Promise<AuthorListResponseDto> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const language = await this.resolveLanguage(query.lang);

        const [total, rows] = await Promise.all([
            this.authorRepository.countAuthors(),
            this.authorRepository.findAuthors(language.id, page, limit),
        ]);

        const items: AuthorItemResponseDto[] = rows.map((row) => ({
            id: row.id.toString(),
            name: row.translations[0]?.displayName ?? row.defaultName,
        }));

        return {
            page,
            limit,
            total,
            totalPages: total ? Math.ceil(total / limit) : 0,
            items,
        };
    }

    async getAuthorBooks(
        authorId: bigint,
        query: GetAuthorBooksQueryDto,
    ): Promise<AuthorBookListResponseDto> {
        const exists = await this.authorRepository.existsById(authorId);
        if (!exists) {
            throw new NotFoundException('Author not found');
        }

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const language = await this.resolveLanguage(query.lang);

        const [total, rows] = await Promise.all([
            this.bookAuthorService.countBooksByAuthor(authorId, language.id),
            this.bookAuthorService.findBooksByAuthor(authorId, language.id, page, limit),
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

        return {
            page,
            limit,
            total,
            totalPages: total ? Math.ceil(total / limit) : 0,
            items,
        };
    }

    private async resolveLanguage(lang?: string): Promise<{ id: number; code: string }> {
        const normalized = (lang ?? 'en').trim().toLowerCase();
        const found = await this.authorRepository.findLanguageByCode(normalized);
        if (!found) {
            throw new NotFoundException(`Language "${normalized}" is not active`);
        }

        return found;
    }
}
