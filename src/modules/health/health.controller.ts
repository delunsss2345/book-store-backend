import { AppModule } from '@/app.module';
import { PermissionsGuard } from '@/common/guard/permission.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';

@Controller('health')
@UseGuards(PermissionsGuard)
export class HealthController {
    constructor() { }
    @Get()
    getProduction() {
        return !AppModule.CONFIGURATION.IS_DEV ? 'production' : "dev"
    }
}