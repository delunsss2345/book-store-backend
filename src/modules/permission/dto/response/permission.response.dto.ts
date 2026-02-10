import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HTTPMethod } from '@prisma/client';

export class PermissionResponseDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiPropertyOptional({ example: 'USER_READ' })
    code: string | null;

    @ApiPropertyOptional({ example: 'Allow reading user information' })
    description: string | null;

    @ApiProperty({ enum: HTTPMethod, example: HTTPMethod.GET })
    method: HTTPMethod;

    @ApiProperty({ example: '/users/:id' })
    pathPattern: string;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiProperty({ example: '2026-02-10T14:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-02-10T14:00:00.000Z' })
    updatedAt: Date;

    @ApiPropertyOptional({ example: '2026-02-10T14:00:00.000Z' })
    deletedAt: Date | null;

    @ApiPropertyOptional({ example: '100' })
    createdById: string | null;

    @ApiPropertyOptional({ example: '101' })
    updatedById: string | null;
}
