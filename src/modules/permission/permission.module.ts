import { Module } from '@nestjs/common';
import { PermissionController } from './controller/permission.controller';
import { PermissionRepository } from './repository/permission.repository';
import { PermissionService } from './service/permission.service';

@Module({
    controllers: [PermissionController],
    providers: [PermissionService, PermissionRepository],
    exports: [PermissionService, PermissionRepository],
})
export class PermissionModule { }
