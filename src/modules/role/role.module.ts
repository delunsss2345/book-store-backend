import { CacheProvider } from '@/config/redis.config';
import { PermissionController } from '@/modules/role/permission/controller/permission.controller';
import { PermissionRepository } from '@/modules/role/permission/repository/permission.repository';
import { PermissionService } from '@/modules/role/permission/service/permission.service';
import { RolePermissionRepository } from '@/modules/role/repository/role-permission.repository';
import { RoleRepository } from '@/modules/role/repository/role.repository';
import { Module } from '@nestjs/common';
import { RolePermissionController } from './controller/role-permission.controller';
import { RoleController } from './controller/role.controller';
import { RolePermissionService } from './service/role-permission.service';
import { RoleService } from './service/role.service';

@Module({
  imports: [CacheProvider],
  controllers: [RoleController, RolePermissionController, PermissionController],
  providers: [
    RoleService,
    RolePermissionService,
    PermissionService,
    RoleRepository,
    RolePermissionRepository,
    PermissionRepository,
  ],
  exports: [
    RoleService,
    RolePermissionService,
    PermissionService,
    RoleRepository,
    RolePermissionRepository,
    PermissionRepository,
  ]
})
export class RoleModule { }
