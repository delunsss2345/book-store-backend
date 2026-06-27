import { RedisIoredisProvider } from '@/config/redis.config';
import { Global, Module } from '@nestjs/common';
@Global()
@Module(RedisIoredisProvider)
export class RedisModule { };