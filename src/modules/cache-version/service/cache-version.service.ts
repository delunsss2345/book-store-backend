import { CACHE_PREFIX } from '@/common/constants/cache-prefix.constant';
import { CACHE_REDIS } from '@/config/redis.config';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheVersionService {
    constructor(@Inject(CACHE_REDIS) private readonly redis: Redis) { }

    private createVersionKey(namespace: string) {
        return `${CACHE_PREFIX}:${namespace}:version`;
    }

    private async getVersionKey(namespace: string) {
        const versionKey = this.createVersionKey(namespace);
        const version = await this.redis.get(versionKey);
        if (!version) {
            await this.redis.set(versionKey, 1);
            return 1;
        }

        return Number(version);
    }

    private async createCacheKey(namespace: string) {
        const version = await this.getVersionKey(namespace);
        return `${CACHE_PREFIX}:data:${namespace}:v:${version}`;
    }

    public async withCache<T>(
        namespace: string,
        ttl: number,
        factory: () => Promise<T>,
    ): Promise<T> {
        const cacheVersionKey = await this.createCacheKey(namespace);

        const raw = await this.redis.get(cacheVersionKey);
        const cached = raw ? (JSON.parse(raw) as T) : null;
        if (cached) return cached;

        const value = await factory();
        const serialized = JSON.stringify(value);
        await this.redis.set(cacheVersionKey, serialized, 'EX', ttl);
        return value;
    }

    public async set<T>(
        namespace: string,
        value: T,
        ttlSeconds?: number,
    ): Promise<void> {
        const cacheVersionKey = await this.createCacheKey(namespace);

        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
            await this.redis.set(cacheVersionKey, serialized, 'EX', ttlSeconds);
        } else {
            await this.redis.set(cacheVersionKey, serialized);
        }
    }

    public async get<T>(namespace: string): Promise<T | null> {
        const cacheVersionKey = await this.createCacheKey(namespace);

        const raw = await this.redis.get(cacheVersionKey);
        return raw ? (JSON.parse(raw) as T) : null;
    }

    public async bumpVersion(namespace: string) {
        return this.redis.incr(this.createVersionKey(namespace));
    }
}
