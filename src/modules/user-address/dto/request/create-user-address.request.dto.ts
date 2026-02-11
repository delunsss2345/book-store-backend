import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserAddressRequestDto {
    @ApiPropertyOptional({ maxLength: 50, example: 'HOME' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    addressType?: string;

    @ApiPropertyOptional({ maxLength: 200, example: 'Nguyen Van A' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    recipientName?: string;

    @ApiProperty({ maxLength: 30, example: '0901234567' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    phoneNumber: string;

    @ApiProperty({ maxLength: 255, example: '123 Le Loi, Block A' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    addressDetail: string;

    @ApiProperty({ maxLength: 200, example: 'Ward 1' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    ward: string;

    @ApiProperty({ maxLength: 200, example: 'District 1' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    district: string;

    @ApiProperty({ maxLength: 200, example: 'Ho Chi Minh City' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    city: string;
}
