import { ApiProperty } from '@nestjs/swagger';

export class RolePermissionResponseDto {
    @ApiProperty({ example: '1' })
    roleId: string;

    @ApiProperty({ example: '2' })
    permissionId: string;

    @ApiProperty({ example: '2026-02-10T14:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-02-10T14:05:00.000Z' })
    updatedAt: Date;
}
