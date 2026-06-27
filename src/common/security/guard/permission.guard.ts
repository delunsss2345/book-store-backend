import { cacheKey } from '@/common/constants/cache-key.constant';
import { PERMISSION_CACHE_TTL } from '@/common/constants/enum-ttl.constant';
import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { PERMISSION_KEY } from '@/common/security/decorators/requirePermission.decorator';
import { RolePermissionService } from '@/modules/role/service/role-permission.service';
import { UserRoleService } from '@/modules/user/service/user-role.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, type Provider } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Cache } from 'cache-manager';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector,
        private readonly userRoleService: UserRoleService,
        private readonly rolePermissionService: RolePermissionService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requireRemission = this.reflector.getAllAndOverride<PermissionCode>(PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requireRemission) {
            return true;
        }


        const { user } = context.switchToHttp().getRequest();
        const roleIds = await this.userRoleService.getRoleIdsByUserId(user.sub);

        const keys = roleIds.map((id: number) => cacheKey.role.permissions(id));
        const cached = await Promise.all(keys.map(k => this.cacheManager.get<string[]>(k)));

        const permsByRole: any = await Promise.all(
            roleIds.map(async (roleId, i) => {
                const permissionCached = cached[i];
                if (permissionCached) {
                    return permissionCached;
                }

                const permissions = await this.rolePermissionService.getByRoleId(roleId);
                await this.cacheManager.set(cacheKey.role.permissions(roleId), permissions, PERMISSION_CACHE_TTL);
                return permissions;
            })
        );
        const userPerms = new Set(permsByRole.flat());
        console.log(userPerms);
        if (!userPerms.has(requireRemission)) throw new ForbiddenException();
        return true;
    }
}

export const PermissionProviderGuard = {
    provide: PermissionsGuard,
    useClass: PermissionsGuard,
} as Provider;

