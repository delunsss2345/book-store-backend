import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreatePermissionRequestDto, UpdatePermissionRequestDto } from '../dto/request';
import { PermissionService } from '../service/permission.service';

@Controller('permission')
export class PermissionController {
    constructor(private readonly permissionService: PermissionService) { }

    @Get()
    getAllPermissions() {
        return this.permissionService.findAllPermissions();
    }

    @Get('/:permissionName')
    getPermissionByName(@Param('permissionName') name: string) {
        return this.permissionService.findPermissionByName(name)
    }

    @Post()
    @RequirePermissions(PermissionCode.PERMISSION_CREATE)
    createPermission(@Body() body: CreatePermissionRequestDto, @GetUser() user: JwtPayload) {
        const actorUserId = Number(user?.sub);
        return this.permissionService.createPermission(body, actorUserId);
    }

    @Patch(':id')
    @RequirePermissions(PermissionCode.PERMISSION_UPDATE)
    updatePermission(
        @Param('id') id: string,
        @Body() body: UpdatePermissionRequestDto,
        @GetUser() user: JwtPayload,
    ) {
        const permissionId = Number(id);
        const actorUserId = Number(user?.sub);
        return this.permissionService.updatePermission(permissionId, body, actorUserId);
    }

    @Delete(':id')
    @RequirePermissions(PermissionCode.PERMISSION_DELETE)
    deletePermission(@Param('id') id: string, @GetUser() user: JwtPayload) {
        const permissionId = Number(id);
        const actorUserId = Number(user?.sub);
        return this.permissionService.deletePermission(permissionId, actorUserId);
    }
}
