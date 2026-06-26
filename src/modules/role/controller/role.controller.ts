import { Public } from '@/common/security/decorators/public.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RoleService } from '../service/role.service';


@ApiTags('role')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) { }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiOkResponse({ type: Object, isArray: true, description: 'List of all roles' })
  getAll() {
    return this.roleService.findAllRole();
  }

  @Get(":name")
  @Public()
  @ApiOperation({ summary: 'Get a role by name' })
  @ApiParam({ name: 'name', type: String, description: 'Role name' })
  @ApiOkResponse({ type: Object, description: 'Role matching the given name' })
  getRoleByName(@Param('name') name: string) {
    return this.roleService.findRoleByName(name);
  }
}
