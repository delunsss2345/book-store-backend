import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HTTPMethod } from '@prisma/client';
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreatePermissionRequestDto {
    @ApiPropertyOptional({ maxLength: 100, example: 'USER_READ' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    code?: string;

    @ApiPropertyOptional({ example: 'Allow reading user information' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: HTTPMethod, example: HTTPMethod.GET })
    @IsEnum(HTTPMethod)
    method: HTTPMethod;

    @ApiProperty({ maxLength: 500, example: '/users/:id' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    pathPattern: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
