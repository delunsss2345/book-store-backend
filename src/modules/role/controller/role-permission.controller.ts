import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateRolePermissionRequestDto } from '../dto/request';
import { RolePermissionService } from '../service/role-permission.service';

@Controller('role-permission')
export class RolePermissionController {
    constructor(private readonly rolePermissionService: RolePermissionService) { }

    @Post()
    @RequirePermissions(PermissionCode.ROLE_PERMISSION_GRANT)
    createRolePermission(@Body() body: CreateRolePermissionRequestDto) {
        const roleId = Number(body.roleId);
        const permissionId = Number(body.permissionId);

        return this.rolePermissionService.createRolePermission({
            roleId,
            permissionId,
        });
    }

    @Get('role/:roleId')
    getByRoleId(@Param('roleId') roleId: string) {
        const parsedRoleId = Number(roleId);
        return this.rolePermissionService.getByRoleId(parsedRoleId);
    }

    @Get('permission/:permissionId')
    getByPermissionId(@Param('permissionId') permissionId: string) {
        const parsedPermissionId = Number(permissionId);
        return this.rolePermissionService.getByPermissionId(parsedPermissionId);
    }
}
