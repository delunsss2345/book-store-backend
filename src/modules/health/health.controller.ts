import { AppModule } from '@/app.module';
import { Public } from '@/common/security/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
export class HealthController {
  constructor() {}
  @Get()
  @Public()
  @SkipThrottle()
  getProduction() {
    return !AppModule.CONFIGURATION.IS_DEV ? 'production' : 'dev';
  }
}
