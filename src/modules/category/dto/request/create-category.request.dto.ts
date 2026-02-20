import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateCategoryRequestDto {
    @ApiProperty({ example: 'Programming', maxLength: 255 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ example: 'en', default: 'en', enum: ['vi', 'en'] })
    @IsOptional()
    @IsIn(['vi', 'en'])
    lang?: string;

    @ApiPropertyOptional({ example: '1' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    parentId?: string;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ example: 0, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    sortOrder?: number;

    @ApiPropertyOptional({ example: 'programming', maxLength: 255 })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    slug?: string;

    @ApiPropertyOptional({
        example: 'Books and learning resources for software development.',
    })
    @IsOptional()
    @IsString()
    description?: string;
}
