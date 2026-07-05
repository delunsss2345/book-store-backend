import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserEventRequestDto {
    @ApiPropertyOptional({ example: 'bookVariant', maxLength: 50 })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    objectType?: string;

    @ApiPropertyOptional({ example: '123', maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    objectId?: string;

    @ApiPropertyOptional({ example: 120000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    amount?: number;

    @ApiPropertyOptional({ example: 'VND', maxLength: 3 })
    @IsOptional()
    @IsString()
    @MaxLength(3)
    currencyCode?: string;

    @ApiPropertyOptional({
        example: { source: 'product-detail', categoryIds: ['10', '11'] },
        description: 'Additional event payload',
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;
}

