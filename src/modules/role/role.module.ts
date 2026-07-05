import { CacheProvider } from '@/config/redis.config';
import { RolePermissionRepository } from '@/modules/role/repository/role-permission.repository';
import { RoleRepository } from '@/modules/role/repository/role.repository';
import { Module } from '@nestjs/common';
import { RolePermissionController } from './controller/role-permission.controller';
import { RoleController } from './controller/role.controller';
import { RolePermissionService } from './service/role-permission.service';
import { RoleService } from './service/role.service';

@Module({
  imports: [CacheProvider],
  controllers: [RoleController, RolePermissionController],
  providers: [RoleService, RolePermissionService, RoleRepository, RolePermissionRepository],
  exports: [RoleService, RolePermissionService, RoleRepository, RolePermissionRepository]
})
export class RoleModule { }
