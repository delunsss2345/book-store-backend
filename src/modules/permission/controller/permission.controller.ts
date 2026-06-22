import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UpdatePermissionRequestDto } from '../dto/request';
import { PermissionService } from '../service/permission.service';

@Controller('permission')
export class PermissionController {
    constructor(private readonly permissionService: PermissionService) { }

    @Get()
    @RequirePermissions(PermissionCode.ADMIN_GET_PERMISSION)
    getAllPermissions() {
        return this.permissionService.findAllPermissions();
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
}
