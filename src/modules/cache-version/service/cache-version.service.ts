import { CACHE_PREFIX } from "@/common/constants/cache-prefix.constant";
import { CACHE_REDIS } from "@/config/redis.config";
import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class CacheVersionService {
    constructor(@Inject(CACHE_REDIS) private readonly redis: Redis) { }


    async withCache<T>(
        namespace: string,
        ttl: number,
        factory: () => Promise<T>,
    ): Promise<T> {
        const cacheVersionName = `${CACHE_PREFIX}:${namespace}`

        const cached = await this.get<T>(cacheVersionName);
        if (cached) return cached;

        const value = await factory();
        await this.set(cacheVersionName, value, ttl);
        return value;
    }

    async set<T>(namespace: string, value: T, ttlSeconds?: number): Promise<void> {
        const cacheVersionName = `${CACHE_PREFIX}:${namespace}`
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
            await this.redis.set(cacheVersionName, serialized, 'EX', ttlSeconds);
        } else {
            await this.redis.set(cacheVersionName, serialized);
        }
    }


    async get<T>(namespace: string): Promise<T | null> {
        const cacheVersionName = `${CACHE_PREFIX}:${namespace}`
        const raw = await this.redis.get(cacheVersionName);
        return raw ? (JSON.parse(raw) as T) : null;
    }


    async bumpVersion(namespace: string) {
        const cacheVersionName = `${CACHE_PREFIX}:${namespace}`
        return this.redis.incr(cacheVersionName);
    }
}