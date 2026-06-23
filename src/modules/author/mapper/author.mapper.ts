import { BookAuthorRepository } from '../../book/author/repository/book-author.repository';
import { AuthorBookItemResponseDto } from '../dto/response/author-book-item.response.dto';
import { AuthorItemResponseDto } from '../dto/response/author-item.response.dto';
import { AuthorRepository } from '../repository/author.repository';

type AuthorRow = Awaited<ReturnType<AuthorRepository['findAuthors']>>[number];

type AuthorBookRow = Awaited<
  ReturnType<BookAuthorRepository['findBooksByAuthor']>
>[number];

export const AuthorMapper = {
  toItem(author: AuthorRow): AuthorItemResponseDto {
    return {
      id: author.id.toString(),
      name: author.defaultName,
    };
  },

  toBookItem(row: AuthorBookRow): AuthorBookItemResponseDto {
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
  },
};
