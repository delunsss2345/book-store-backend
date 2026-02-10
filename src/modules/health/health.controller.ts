import { AppModule } from '@/app.module';
import { Public } from '@/common/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    constructor() { }
    @Public()
    @Get()
    getProduction() {
        return !AppModule.CONFIGURATION.IS_DEV ? 'production' : "dev"
    }
}