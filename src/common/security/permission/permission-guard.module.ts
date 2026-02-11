import { PermissionsGuard } from '@/common/security/guard/permission.guard';
import { CacheProvider } from '@/config/redis.config';
import { RolePermissionModule } from '@/modules/role-permission/role-permission.module';
import { UserRoleModule } from '@/modules/user-role/user-role.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [RolePermissionModule, UserRoleModule, CacheProvider],
    providers: [PermissionsGuard],
    exports: [PermissionsGuard],
})
export class PermissionGuardModule { }
