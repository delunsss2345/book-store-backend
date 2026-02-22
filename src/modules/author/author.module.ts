import { Module } from '@nestjs/common';
import { BookAuthorModule } from '../book-author/book-author.module';
import { LanguageModule } from '../language/language.module';
import { AuthorController } from './author.controller';
import { AuthorRepository } from './author.repository';
import { AuthorService } from './author.service';

@Module({
    imports: [BookAuthorModule, LanguageModule],
    controllers: [AuthorController],
    providers: [AuthorService, AuthorRepository],
    exports: [AuthorService],
})
export class AuthorModule { }
