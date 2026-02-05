
import { AppConfiguration } from '@/config/app.config';
import { BaseConfiguration } from '@/config/base.config';
import { JwtConfiguration } from '@/config/jwt.config';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { config } from 'dotenv';
config()
class Configuration extends BaseConfiguration {
    @ValidateNested()
    @Type(() => AppConfiguration)
    APP_CONFIG = new AppConfiguration();

    @ValidateNested()
    @Type(() => JwtConfiguration)
    JWT_CONFIG = new JwtConfiguration();
}
export const CONFIGURATION = new Configuration();