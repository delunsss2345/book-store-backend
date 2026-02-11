import { HealthController } from '@/modules/health/health.controller';
import { Module } from '@nestjs/common';

@Module({
    controllers: [HealthController],
    providers: [],
})
export class HealthModule { };
