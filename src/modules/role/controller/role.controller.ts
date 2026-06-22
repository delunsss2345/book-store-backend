import { Public } from '@/common/security/decorators/public.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import { RoleService } from '../service/role.service';


@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) { }

  @Get()
  getAll() {
    return this.roleService.findAllRole();
  }

  @Get(":name")
  @Public()
  getRoleByName(@Param('name') name: string) {
    return this.roleService.findRoleByName(name);
  }
}
