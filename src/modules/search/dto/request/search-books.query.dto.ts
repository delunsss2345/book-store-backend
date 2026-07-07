import { BasePaginationDto } from '@/common/pagination/request/base-pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsString
} from 'class-validator';


export class SearchBooksQueryDto extends BasePaginationDto {
    @ApiProperty({ example: 'sach lap trinh backend' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty()
    q: string;
}
