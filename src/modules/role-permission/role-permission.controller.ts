import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/decorators/requirePermission.decorator';
import { PermissionsGuard } from '@/common/guard/permission.guard';
import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateRolePermissionRequestDto } from './dto/request';
import { RolePermissionService } from './role-permission.service';

@Controller('role-permission')
@UseGuards(PermissionsGuard)
export class RolePermissionController {
    constructor(private readonly rolePermissionService: RolePermissionService) { }

    @Post()
    @RequirePermissions(PermissionCode.ROLE_PERMISSION_GRANT)
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
