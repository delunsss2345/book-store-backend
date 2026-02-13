import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class CatalogCategoriesQueryDto {
    @ApiPropertyOptional({ example: 'en', default: 'en', enum: ['vi', 'en'] })
    @IsOptional()
    @IsIn(['vi', 'en'])
    lang?: string;
}
