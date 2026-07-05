import { Module } from '@nestjs/common';
import { CategoryController } from './controller/category.controller';
import { CategoryRepository } from './repository/category.repository';
import { CategoryService } from './service/category.service';

@Module({
    controllers: [CategoryController],
    providers: [CategoryService, CategoryRepository],
    exports: [CategoryService],
})
export class CategoryModule { }
