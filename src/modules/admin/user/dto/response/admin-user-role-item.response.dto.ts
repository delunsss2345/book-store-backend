import { ApiProperty } from '@nestjs/swagger';

export class AdminUserRoleItemResponseDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiProperty({ example: 'ADMIN' })
    code: string;

    @ApiProperty({ example: 'admin' })
    name: string;
}
