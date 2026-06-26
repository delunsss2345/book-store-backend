import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateRolePermissionRequestDto } from '../dto/request';
import { RolePermissionResponseDto } from '../dto/response/role-permission.response.dto';
import { RolePermissionService } from '../service/role-permission.service';

@ApiTags('Role Permission')
@Controller('role-permission')
export class RolePermissionController {
    constructor(private readonly rolePermissionService: RolePermissionService) { }

    @Post()
    @RequirePermissions(PermissionCode.ROLE_PERMISSION_GRANT)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Grant a permission to a role' })
    @ApiCreatedResponse({ type: RolePermissionResponseDto })
    createRolePermission(@Body() body: CreateRolePermissionRequestDto) {
        const roleId = Number(body.roleId);
        const permissionId = Number(body.permissionId);

        return this.rolePermissionService.createRolePermission({
            roleId,
            permissionId,
        });
    }

    @Get('role/:roleId')
    @ApiOperation({ summary: 'Get all permissions assigned to a role' })
    @ApiParam({ name: 'roleId', type: Number, description: 'ID of the role' })
    @ApiOkResponse({ type: RolePermissionResponseDto, isArray: true })
    getByRoleId(@Param('roleId') roleId: string) {
        const parsedRoleId = Number(roleId);
        return this.rolePermissionService.getByRoleId(parsedRoleId);
    }

    @Get('permission/:permissionId')
    @ApiOperation({ summary: 'Get all roles assigned to a permission' })
    @ApiParam({ name: 'permissionId', type: Number, description: 'ID of the permission' })
    @ApiOkResponse({ type: RolePermissionResponseDto, isArray: true })
    getByPermissionId(@Param('permissionId') permissionId: string) {
        const parsedPermissionId = Number(permissionId);
        return this.rolePermissionService.getByPermissionId(parsedPermissionId);
    }
}
