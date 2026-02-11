import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CatalogHomeQueryDto {
    @ApiPropertyOptional({ example: 'vi', default: 'vi' })
    @IsOptional()
    @IsString()
    lang?: string;

    @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 50, default: 12 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number;
}
