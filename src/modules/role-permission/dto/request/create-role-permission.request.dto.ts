import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRolePermissionRequestDto {
    @ApiProperty({ example: '1' })
    @IsString()
    @IsNotEmpty()
    roleId: string;

    @ApiProperty({ example: '2' })
    @IsString()
    @IsNotEmpty()
    permissionId: string;
}
