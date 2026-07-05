import { HealthController } from '@/modules/health/controller/health.controller';
import { Module } from '@nestjs/common';

@Module({
    controllers: [HealthController],
})
export class HealthModule { };
