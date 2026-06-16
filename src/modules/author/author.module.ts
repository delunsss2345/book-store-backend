import { Module } from '@nestjs/common';
import { BookAuthorModule } from '../book/author/book-author.module';
import { AuthorController } from './author.controller';
import { AuthorRepository } from './author.repository';
import { AuthorService } from './author.service';

@Module({
    imports: [BookAuthorModule],
    controllers: [AuthorController],
    providers: [AuthorService, AuthorRepository],
    exports: [AuthorService],
})
export class AuthorModule { }
