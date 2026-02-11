import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { PERMISSION_KEY } from '@/common/decorators/requirePermission.decorator';
import { RolePermissionService } from '@/modules/role-permission/role-permission.service';
import { UserRoleService } from '@/modules/user-role/user-role.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
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


        const keyOf = (id: bigint) => `role:${id}:perms`; // key roles
        const keys = roleIds.map((id: bigint) => `role:${id}:perms`); // return mảng key
        const cached = await Promise.all(keys.map(k => this.cacheManager.get<string[]>(k))); // get cache xem có ko

        const permsByRole: any = await Promise.all(
            roleIds.map(async (roleId, i) => {

                const permissionCached = cached[i];  // nếu có trả về 
                if (permissionCached) {
                    return permissionCached;
                }

                const permissions = await this.rolePermissionService.getByRoleId(roleId); // nếu chưa thì get và cached
                // console.log(keyOf(roleId), permissions); 
                await this.cacheManager.set(keyOf(roleId), permissions);
                return permissions;
            })
        );
        const userPerms = new Set(permsByRole.flat());

        if (!userPerms.has(requireRemission)) throw new ForbiddenException();
        return true;

    }
}