import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAdminBookTranslationRequestDto {
    @ApiPropertyOptional({ example: 'vi', default: 'vi', enum: ['vi', 'en'] })
    @IsOptional()
    @IsIn(['vi', 'en'])
    lang?: string;

    @ApiProperty({ example: 'Dữ liệu lớn cho backend hiện đại', maxLength: 500 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    title: string;

    @ApiPropertyOptional({ example: 'Mô tả chi tiết về quyển sách', maxLength: 5000 })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;
}
