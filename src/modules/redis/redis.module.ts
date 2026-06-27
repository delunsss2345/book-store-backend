import { RedisIoredisProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';

@Module(RedisIoredisProvider)
export class RedisModule { };