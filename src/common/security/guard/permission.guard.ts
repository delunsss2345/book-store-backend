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

        // hàm tạo key cache theo roleId, có thể dùng chung cho tất cả cache liên quan đến roleId, tránh việc tạo nhiều key khác nhau cho cùng 1 data
        const keyOf = (id: bigint) => `role_user:${id}:perms`; // key roles

        //  get cache theo key, nếu có trả về, nếu không có thì get từ db và cache lại
        const keys = roleIds.map((id: bigint) => `role_per:${id}:perms`); // return mảng key
        const cached = await Promise.all(keys.map(k => this.cacheManager.get<string[]>(k))); // get cache xem có ko

        const permsByRole: any = await Promise.all(
            roleIds.map(async (roleId, i) => {
                const permissionCached = cached[i];  // nếu có trả về 
                if (permissionCached) {
                    return permissionCached;
                }

                const permissions = await this.rolePermissionService.getByRoleId(roleId); // nếu chưa thì get và cached
                await this.cacheManager.set(keyOf(roleId), permissions, PERMISSION_CACHE_TTL); // cache 1h
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

