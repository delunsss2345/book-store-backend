import { Injectable } from '@nestjs/common';
import { BookAuthorRepository } from './book-author.repository';

@Injectable()
export class BookAuthorService {
    constructor(private readonly bookAuthorRepository: BookAuthorRepository) { }

    countBooksByAuthor(authorId: bigint, languageId: number) {
        return this.bookAuthorRepository.countBooksByAuthor(authorId, languageId);
    }

    findBooksByAuthor(authorId: bigint, languageId: number, page: number, limit: number) {
        return this.bookAuthorRepository.findBooksByAuthor(authorId, languageId, page, limit);
    }
}
