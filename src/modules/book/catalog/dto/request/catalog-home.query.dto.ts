import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CatalogHomeQueryDto {
    @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 50, default: 12 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number;
}
