import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UpdatePermissionRequestDto } from '../dto/request';
import { PermissionResponseDto } from '../dto/response';
import { PermissionService } from '../service/permission.service';

@ApiTags('Permission')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermissions(PermissionCode.PERMISSION_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiOkResponse({ type: PermissionResponseDto, isArray: true })
  getAllPermissions() {
    return this.permissionService.findAllPermissions();
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.PERMISSION_UPDATE)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a permission by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Permission ID' })
  @ApiOkResponse({ type: PermissionResponseDto })
  updatePermission(
    @Param('id') id: string,
    @Body() body: UpdatePermissionRequestDto,
    @GetUser() user: JwtPayload,
  ) {
    const permissionId = Number(id);
    const actorUserId = Number(user?.sub);
    return this.permissionService.updatePermission(
      permissionId,
      body,
      actorUserId,
    );
  }
}
