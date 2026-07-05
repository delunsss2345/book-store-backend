import { CACHE_REDIS, RedisIoredisProvider } from '@/config/redis.config';
import { RedisHealthService } from '@/modules/redis/service/redis-health.service';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
@Global()
@Module({
    imports: [ConfigModule],
    providers: [RedisIoredisProvider, RedisHealthService],
    exports: [CACHE_REDIS],
})
export class RedisModule { };