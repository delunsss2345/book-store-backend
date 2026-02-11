import { CacheProvider } from '@/config/redis.config';
import { RolePermissionModule } from '@/modules/role-permission/role-permission.module';
import { UserRoleModule } from '@/modules/user-role/user-role.module';
import { Global, Module } from '@nestjs/common';
import { PermissionProviderGuard, PermissionsGuard } from './permission.guard';

@Global()
@Module({
    imports: [RolePermissionModule, UserRoleModule, CacheProvider],
    providers: [PermissionProviderGuard],
    exports: [PermissionsGuard],
})
export class PermissionGuardModule { }
