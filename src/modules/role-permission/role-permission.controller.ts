import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateRolePermissionRequestDto } from './dto/request';
import { RolePermissionService } from './role-permission.service';

@Controller('role-permission')
export class RolePermissionController {
    constructor(private readonly rolePermissionService: RolePermissionService) { }

    @Post()
    createRolePermission(@Body() body: CreateRolePermissionRequestDto) {
        const roleId = this.parseBigInt(body.roleId, 'roleId');
        const permissionId = this.parseBigInt(body.permissionId, 'permissionId');

        return this.rolePermissionService.createRolePermission({
            roleId,
            permissionId,
        });
    }

    @Get('role/:roleId')
    getByRoleId(@Param('roleId') roleId: string) {
        const parsedRoleId = this.parseBigInt(roleId, 'roleId');
        return this.rolePermissionService.getByRoleId(parsedRoleId);
    }

    @Get('permission/:permissionId')
    getByPermissionId(@Param('permissionId') permissionId: string) {
        const parsedPermissionId = this.parseBigInt(permissionId, 'permissionId');
        return this.rolePermissionService.getByPermissionId(parsedPermissionId);
    }

    private parseBigInt(value: string | undefined, fieldName: string): bigint {
        if (!value) {
            throw new BadRequestException(`${fieldName} is required`);
        }

        try {
            return BigInt(value);
        } catch {
            throw new BadRequestException(`${fieldName} must be a bigint`);
        }
    }
}
