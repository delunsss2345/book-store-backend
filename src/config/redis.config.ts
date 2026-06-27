import KeyvRedis, { Keyv } from '@keyv/redis';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheableMemory } from 'cacheable';
import { IsNotEmpty, IsNumber, IsString, validateSync } from 'class-validator';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS')
export class RedisConfiguration {
  @IsNumber()
  @IsNotEmpty()
  REDIS_PORT!: number;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_USERNAME!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_PASSWORD!: string;

  constructor(data: Partial<RedisConfiguration> = {}) {
    this.REDIS_HOST = data.REDIS_HOST ?? process.env['REDIS_HOST'] ?? '';
    this.REDIS_PORT = data.REDIS_PORT ?? Number(process.env['REDIS_PORT'] ?? 0);
    this.REDIS_USERNAME =
      data.REDIS_USERNAME ?? process.env['REDIS_USERNAME'] ?? '';
    this.REDIS_PASSWORD =
      data.REDIS_PASSWORD ?? process.env['REDIS_PASSWORD'] ?? '';

    const errors = validateSync(this);
    if (errors.length) {
      console.log(errors);
    }
  }
}

export const RedisProvider = BullModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const host = config.get<string>('REDIS_HOST');
    const port = Number(config.get<number | string>('REDIS_PORT'));
    const username = config.get<string>('REDIS_USERNAME') || undefined;
    const password = config.get<string>('REDIS_PASSWORD') || undefined;

    if (!host || !Number.isFinite(port)) {
      throw new Error('Invalid Redis config (REDIS_HOST/REDIS_PORT)');
    }

    return {
      connection: {
        host,
        port,
        username,
        password,
      },
    };
  },
});

export const RedisIoredisProvider = {
  imports: [ConfigModule],
  inject: [ConfigService],
  providers: [
    {
      provide: REDIS,
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST');
        const port = Number(config.get<number | string>('REDIS_PORT'));
        if (!host || !port) {
          throw new Error('Invalid Redis config');
        }
        const username = config.get<string>('REDIS_USERNAME') || undefined;
        const password = config.get<string>('REDIS_PASSWORD') || undefined;

        return new Redis({ host, port, username, password })
      },
    },
  ],
  exports: [REDIS],
}

export const CacheProvider = CacheModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const host = config.get<string>('REDIS_HOST');
    const port = Number(config.get<number | string>('REDIS_PORT'));
    const password = config.get<string>('REDIS_PASSWORD') || undefined;
    return {
      stores: [
        new Keyv({
          store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
        }),
        new KeyvRedis(`redis://default:${password}@${host}:${port}`),
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
