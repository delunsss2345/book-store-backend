import { AppConfiguration } from '@/config/app.config';
import { BaseConfiguration } from '@/config/base.config';
import { GoogleConfiguration } from '@/config/google.config';
import { JwtConfiguration } from '@/config/jwt.config';
import { NodemailerConfiguration } from '@/config/nodemailer.config';
import { RedisConfiguration } from '@/config/redis.config';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { config } from 'dotenv';
import { R2Configuration } from './r2.config';
import { SepayConfiguration } from './sepay.config';
config();
class Configuration extends BaseConfiguration {
  @ValidateNested()
  @Type(() => AppConfiguration)
  APP_CONFIG = new AppConfiguration();

  @ValidateNested()
  @Type(() => JwtConfiguration)
  JWT_CONFIG = new JwtConfiguration();

  @ValidateNested()
  @Type(() => RedisConfiguration)
  REDIS_CONFIG = new RedisConfiguration();

  @ValidateNested()
  @Type(() => NodemailerConfiguration)
  NODEMAILER_CONFIG = new NodemailerConfiguration();

  @ValidateNested()
  @Type(() => SepayConfiguration)
  SEPAY_CONFIG = new SepayConfiguration();

  @ValidateNested()
  @Type(() => R2Configuration)
  R2_CONFIG = new R2Configuration();

  @ValidateNested()
  @Type(() => GoogleConfiguration)
  GOOGLE_CONFIG = new GoogleConfiguration();
}
export const CONFIGURATION = new Configuration();
export type TConfiguration = typeof CONFIGURATION;
