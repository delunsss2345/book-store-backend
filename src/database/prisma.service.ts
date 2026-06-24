import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { Prisma, PrismaClient } from '@prisma/client';

export type PrismaClientTransaction = Prisma.TransactionClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    const adapter = new PrismaMariaDb({
      host: configService.getOrThrow<string>('DB_HOST'),
      port: configService.getOrThrow<number>('DB_PORT'),
      user: configService.getOrThrow<string>('DB_USER'),
      password: configService.getOrThrow<string>('DB_PASSWORD'),
      database: configService.getOrThrow<string>('DB_NAME'),
      connectionLimit: configService.get<number>('CONNECTION_LIMIT', 20),
      connectTimeout: configService.get<number>('CONNECTION_TIMEOUT', 5000),
      idleTimeout: configService.get<number>('IDLE_TIMEOUT', 300),
    });
    super({ adapter, log: ['error', 'warn'] });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
