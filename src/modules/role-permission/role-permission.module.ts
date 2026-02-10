import { Module } from '@nestjs/common';
import { RolePermissionController } from './role-permission.controller';
import { RolePermissionRepository } from './role-permission.repository';
import { RolePermissionService } from './role-permission.service';

@Module({
    controllers: [RolePermissionController],
    providers: [RolePermissionService, RolePermissionRepository],
    exports: [RolePermissionService, RolePermissionRepository],
})
export class RolePermissionModule { }
