import { PermissionsGuard } from '@/common/security/guard/permission.guard';
import { CacheProvider } from '@/config/redis.config';
import { RoleModule } from '@/modules/role/role.module';
import { UserModule } from '@/modules/user/user.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [RoleModule, UserModule, CacheProvider],
    providers: [PermissionsGuard],
    exports: [PermissionsGuard],
})
export class PermissionGuardModule { }
