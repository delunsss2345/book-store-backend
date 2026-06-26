import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminUserRoleItemResponseDto } from './admin-user-role-item.response.dto';

export class AdminUserItemResponseDto {
    @ApiProperty({ example: '8' })
    id: string;

    @ApiProperty({ example: 'user@example.com' })
    email: string;

    @ApiPropertyOptional({ example: 'Nguyen' })
    firstName: string | null;

    @ApiPropertyOptional({ example: 'An' })
    lastName: string | null;

    @ApiProperty({ example: 'ACTIVE' })
    status: string;

    @ApiProperty({ example: true })
    isEmailVerified: boolean;

    @ApiPropertyOptional({ example: '2026-02-23T21:10:00.000Z' })
    lastLoginAt: Date | null;

    @ApiProperty({ example: '2026-02-23T21:10:00.000Z' })
    createdAt: Date;

    @ApiProperty({ type: () => [AdminUserRoleItemResponseDto] })
    roles: AdminUserRoleItemResponseDto[];
}
