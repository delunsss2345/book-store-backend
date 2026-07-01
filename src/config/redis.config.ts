import KeyvRedis, { Keyv } from '@keyv/redis';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheableMemory } from 'cacheable';
import { IsNotEmpty, IsNumber, IsString, validateSync } from 'class-validator';
import Redis from 'ioredis';

export const CACHE_REDIS = "CACHE_REDIS";
export class RedisConfiguration {
  @IsNumber()
  @IsNotEmpty()
  REDIS_PORT!: number;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string

  constructor(data: Partial<RedisConfiguration> = {}) {
    this.REDIS_HOST = data.REDIS_HOST ?? process.env['REDIS_HOST'] ?? '';
    this.REDIS_PORT = data.REDIS_PORT ?? Number(process.env['REDIS_PORT'] ?? 0);
    this.REDIS_URL = data.REDIS_URL ?? String(process.env['REDIS_URL'] ?? "");

    const errors = validateSync(this);
    if (errors.length) {
      console.log(errors)
      throw new Error(JSON.stringify(errors));

    }
  }
}

export const BullMqModule = BullModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const host = config.get<string>('REDIS_HOST');
    const port = Number(config.get<number | string>('REDIS_PORT'));
    const url = config.get<string>('REDIS_URL') || undefined;
    if (!host || !Number.isFinite(port)) {
      throw new Error('Invalid Redis config (REDIS_HOST/REDIS_PORT)');
    }

    return {
      connection: {
        host,
        port,
        url,
      },
    };
  },
});

export const RedisIoredisProvider = {
  provide: CACHE_REDIS,
  useFactory: (config: ConfigService) => {
    const host = config.get<string>('REDIS_HOST');
    const port = Number(config.get<string>('REDIS_PORT'));

    if (!host || !port) {
      throw new Error('Invalid Redis config');
    }
    return new Redis({
      host,
      port,
    });
  },
  inject: [ConfigService],
};
export const CacheProvider = CacheModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const url = config.get<string>('REDIS_URL') || undefined;
    return {
      stores: [
        new Keyv({
          store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
        }),
        new KeyvRedis(url),
      ],
    };
  },
});
export const EmailQueueProvider = BullModule.registerQueue({
  name: 'email',
});

export const OrderQueueProvider = BullModule.registerQueue({
  name: 'order',
});
