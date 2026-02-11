import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreatePermissionRequestDto, UpdatePermissionRequestDto } from './dto/request';
import { PermissionService } from './permission.service';

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
        const actorUserId = this.parseBigInt(user?.sub, 'user.sub');
        return this.permissionService.createPermission(body, actorUserId);
    }

    @Patch(':id')
    @RequirePermissions(PermissionCode.PERMISSION_UPDATE)
    updatePermission(
        @Param('id') id: string,
        @Body() body: UpdatePermissionRequestDto,
        @GetUser() user: JwtPayload,
    ) {
        const permissionId = this.parseBigInt(id, 'id');
        const actorUserId = this.parseBigInt(user?.sub, 'user.sub');
        return this.permissionService.updatePermission(permissionId, body, actorUserId);
    }

    @Delete(':id')
    @RequirePermissions(PermissionCode.PERMISSION_DELETE)
    deletePermission(@Param('id') id: string, @GetUser() user: JwtPayload) {
        const permissionId = this.parseBigInt(id, 'id');
        const actorUserId = this.parseBigInt(user?.sub, 'user.sub');
        return this.permissionService.deletePermission(permissionId, actorUserId);
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
