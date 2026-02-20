import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateRolePermissionRequestDto } from './dto/request';
import { RolePermissionService } from './role-permission.service';

@Controller('role-permission')
export class RolePermissionController {
    constructor(private readonly rolePermissionService: RolePermissionService) { }

    @Post()
    @RequirePermissions(PermissionCode.ROLE_PERMISSION_GRANT)
    createRolePermission(@Body() body: CreateRolePermissionRequestDto) {
        const roleId = parseBigIntRequired(body.roleId, 'roleId');
        const permissionId = parseBigIntRequired(body.permissionId, 'permissionId');

        return this.rolePermissionService.createRolePermission({
            roleId,
            permissionId,
        });
    }

    @Get('role/:roleId')
    getByRoleId(@Param('roleId') roleId: string) {
        const parsedRoleId = parseBigIntRequired(roleId, 'roleId');
        return this.rolePermissionService.getByRoleId(parsedRoleId);
    }

    @Get('permission/:permissionId')
    getByPermissionId(@Param('permissionId') permissionId: string) {
        const parsedPermissionId = parseBigIntRequired(permissionId, 'permissionId');
        return this.rolePermissionService.getByPermissionId(parsedPermissionId);
    }
}
