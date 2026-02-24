import KeyvRedis, { Keyv } from '@keyv/redis';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheableMemory } from 'cacheable';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

export class R2Configuration {
  @IsString()
  @IsNotEmpty()
  R2_BUCKET!: string;

  @IsString()
  @IsNotEmpty()
  R2_ENDPOINT!: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCESS_KEY_ID!: string;

  @IsString()
  @IsNotEmpty()
  R2_SECRET_ACCESS_KEY!: string;

  @IsString()
  @IsNotEmpty()
  CDN_URL!: string;

  @IsString()
  @IsNotEmpty()
  FOLDER_PRODUCT!: string;

  constructor(data: Partial<R2Configuration> = {}) {
    this.R2_BUCKET = data.R2_BUCKET ?? process.env['R2_BUCKET'] ?? '';
    this.R2_ENDPOINT = data.R2_ENDPOINT ?? process.env['R2_ENDPOINT'] ?? '';
    this.R2_ACCESS_KEY_ID =
      data.R2_ACCESS_KEY_ID ?? process.env['R2_ACCESS_KEY_ID'] ?? '';
    this.R2_SECRET_ACCESS_KEY =
      data.R2_SECRET_ACCESS_KEY ?? process.env['R2_SECRET_ACCESS_KEY'] ?? '';
    this.CDN_URL = data.CDN_URL ?? process.env['CDN_URL'] ?? '';
    this.FOLDER_PRODUCT =
      data.FOLDER_PRODUCT ?? process.env['FOLDER_PRODUCT'] ?? '';

    const errors = validateSync(this);
    if (errors.length) {
      console.log(errors);
    }
  }
}
