import { AppModule } from '@/app.module';
import { Public } from '@/common/security/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    constructor() { }
    @Get()
    @Public()
    getProduction() {
        return !AppModule.CONFIGURATION.IS_DEV ? 'production' : "dev"
    }
}
