import { BasePaginationDto } from '@/common/pagination/request/base-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';



const toQueryParts = ({ value }: { value: unknown }) => {
    if (value == null || value === '') return undefined;
    const raw = Array.isArray(value) ? value : [value];
    const parts = raw
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean);

    return parts.length ? parts : undefined;
};

export class SearchFilterQueryDto extends BasePaginationDto {
    @ApiPropertyOptional({
        example: '1,2,3',
        description: 'Category ids, comma separated or repeated query params',
    })
    @IsOptional()
    @Transform(toQueryParts)
    @IsArray()
    @IsString({ each: true })
    categories?: string[];
}
