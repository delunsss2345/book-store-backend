import { Module } from '@nestjs/common';
import { BookAuthorModule } from '../book/author/book-author.module';
import { AuthorController } from './controller/author.controller';
import { AuthorRepository } from './repository/author.repository';
import { AuthorService } from './service/author.service';

@Module({
    imports: [BookAuthorModule],
    controllers: [AuthorController],
    providers: [AuthorService, AuthorRepository],
    exports: [AuthorService],
})
export class AuthorModule { }
