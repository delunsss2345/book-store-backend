import { CacheProvider } from '@/config/redis.config';
import { HealthController } from '@/modules/health/health.controller';
import { RolePermissionModule } from '@/modules/role-permission/role-permission.module';
import { UserRoleModule } from '@/modules/user-role/user-role.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [RolePermissionModule, UserRoleModule, CacheProvider],
    controllers: [HealthController],
    providers: [],
})
export class HealthModule { };