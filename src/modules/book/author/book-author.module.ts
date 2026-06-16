import { Module } from '@nestjs/common';
import { BookAuthorRepository } from './repository/book-author.repository';
import { BookAuthorService } from './service/book-author.service';

@Module({
    providers: [BookAuthorService, BookAuthorRepository],
    exports: [BookAuthorService, BookAuthorRepository],
})
export class BookAuthorModule { }
