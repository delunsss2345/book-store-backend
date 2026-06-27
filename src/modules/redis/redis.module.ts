import { CACHE_REDIS, RedisIoredisProvider } from '@/config/redis.config';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
@Global()
@Module({
    imports: [ConfigModule],
    providers: [RedisIoredisProvider],
    exports: [CACHE_REDIS],
})
export class RedisModule { };