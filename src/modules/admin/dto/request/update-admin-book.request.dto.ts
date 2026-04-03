import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

export class UpdateAdminBookTranslationRequestDto {
    @ApiPropertyOptional({
        example: 1,
        description: 'Language ID, ví dụ: 1, 2',
    })
    @IsOptional()
    @IsNumber()
    languageId: number;

    @ApiPropertyOptional({
        example: 'Tự học suốt đời theo hệ thống',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({
        example: 'Mô tả sách...',
        maxLength: 5000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;
}

export class UpdateAdminBookRequestDto {
    @ApiPropertyOptional({ example: 260 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageCount?: number;

    @ApiPropertyOptional({ example: 689 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    weightGrams?: number;

    @ApiPropertyOptional({
        example: 'https://cdn.example.com/covers/sample-book.jpg',
        maxLength: 1000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    coverImageUrl?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        type: [UpdateAdminBookTranslationRequestDto],
        example: [
            {
                languageId: 1,
                title: 'Tự học suốt đời theo hệ thống',
                description: 'Mô tả tiếng Việt...',
            },
            {
                languageId: 2,
                title: 'Lifelong Self-Learning Systems',
                description: 'English description...',
            },
        ],
    })
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => UpdateAdminBookTranslationRequestDto)
    translations?: UpdateAdminBookTranslationRequestDto[];
}