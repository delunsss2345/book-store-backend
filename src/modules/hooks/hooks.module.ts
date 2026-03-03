import { CacheProvider } from '@/config/redis.config';
import { PaymentModule } from '@/modules/payment/payment.module';
import { Module } from '@nestjs/common';
import { HooksController } from './hooks.controller';
import { HooksRepository } from './hooks.repository';
import { HooksService } from './hooks.service';
@Module({
    imports: [PaymentModule, CacheProvider],
    controllers: [HooksController],
    providers: [HooksRepository, HooksService],
    exports: [HooksRepository, HooksService],
})
export class HooksModule { };
