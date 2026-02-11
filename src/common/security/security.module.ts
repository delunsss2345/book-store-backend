import { AuthGuardModule } from '@/common/security/authorization/authorization-guard.module';
import { AuthGuard } from '@/common/security/guard/auth.guard';
import { PermissionsGuard } from '@/common/security/guard/permission.guard';
import { PermissionGuardModule } from '@/common/security/permission/permission-guard.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
    imports: [AuthGuardModule, PermissionGuardModule],
    providers: [
        { provide: APP_GUARD, useExisting: AuthGuard },
        { provide: APP_GUARD, useExisting: PermissionsGuard },
    ]
})
export class SecurityModule { }
