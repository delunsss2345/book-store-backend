import { cacheKey } from '@/common/constants/cache-key.constant';
import { RoleRepository } from '@/modules/role/repository/role.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { RoleDTO } from '../dto/response/role.response';

@Injectable()
export class RoleService {
    private readonly TTL = 60_000;

    constructor(
        private readonly roleRepository: RoleRepository,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    async findAllRole(): Promise<RoleDTO[]> {
        const key = cacheKey.role.all();

        const cached = await this.cacheManager.get<RoleDTO[]>(key);
        if (cached) return cached;

        const roles = await this.roleRepository.findAll();
        if (roles?.length) {
            await this.cacheManager.set(key, roles, this.TTL);
        }

        return roles;
    }

    async findRoleByName(name: string): Promise<RoleDTO | null> {
        const key = cacheKey.role.byName(name);

        const cached = await this.cacheManager.get<RoleDTO | null>(key);
        if (cached) return cached;

        const role = await this.roleRepository.findRoleByName(name);

        if (role) {
            await this.cacheManager.set(key, role, this.TTL);
        }

        return role;
    }

    async invalidateRoleCache(name?: string) {
        await this.cacheManager.del(cacheKey.role.all());
        if (name) {
            await this.cacheManager.del(cacheKey.role.byName(name));
        }
    }
}
