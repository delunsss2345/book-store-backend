import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
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

    @Post()
    createPermission(@Body() body: CreatePermissionRequestDto, @GetUser() user: JwtPayload) {
        const actorUserId = this.parseBigInt(user?.sub, 'user.sub');
        return this.permissionService.createPermission(body, actorUserId);
    }

    @Patch(':id')
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
