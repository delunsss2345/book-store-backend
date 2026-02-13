import { Module } from '@nestjs/common';
import { BookAuthorRepository } from './book-author.repository';
import { BookAuthorService } from './book-author.service';

@Module({
    providers: [BookAuthorService, BookAuthorRepository],
    exports: [BookAuthorService, BookAuthorRepository],
})
export class BookAuthorModule { }
