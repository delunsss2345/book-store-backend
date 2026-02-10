import { ApiPropertyOptional } from '@nestjs/swagger';
import { HTTPMethod } from '@prisma/client';
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class UpdatePermissionRequestDto {
    @ApiPropertyOptional({ maxLength: 100, example: 'USER_READ' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    code?: string;

    @ApiPropertyOptional({ example: 'Allow reading user information' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: HTTPMethod, example: HTTPMethod.GET })
    @IsOptional()
    @IsEnum(HTTPMethod)
    method?: HTTPMethod;

    @ApiPropertyOptional({ maxLength: 500, example: '/users/:id' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    pathPattern?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
