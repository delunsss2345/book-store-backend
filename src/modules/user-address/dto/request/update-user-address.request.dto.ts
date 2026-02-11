import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserAddressRequestDto {
    @ApiPropertyOptional({ maxLength: 50, example: 'OFFICE' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    addressType?: string;

    @ApiPropertyOptional({ maxLength: 200, example: 'Tran Thi B' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    recipientName?: string;

    @ApiPropertyOptional({ maxLength: 30, example: '0987654321' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    phoneNumber?: string;

    @ApiPropertyOptional({ maxLength: 255, example: '456 Nguyen Hue, Apartment 12' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    addressDetail?: string;

    @ApiPropertyOptional({ maxLength: 200, example: 'Ward 2' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    ward?: string;

    @ApiPropertyOptional({ maxLength: 200, example: 'District 3' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    district?: string;

    @ApiPropertyOptional({ maxLength: 200, example: 'Da Nang' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    city?: string;
}
