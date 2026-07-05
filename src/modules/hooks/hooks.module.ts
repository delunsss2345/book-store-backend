import { CacheProvider } from '@/config/redis.config';
import { OrderModule } from '@/modules/order/order.module';
import { PaymentModule } from '@/modules/payment/payment.module';
import { Module } from '@nestjs/common';
import { HooksController } from './controller/hooks.controller';
import { HooksRepository } from './repository/hooks.repository';
import { HooksService } from './service/hooks.service';
@Module({
    imports: [PaymentModule, CacheProvider, OrderModule],
    controllers: [HooksController],
    providers: [HooksRepository, HooksService],
    exports: [HooksRepository, HooksService],
})
export class HooksModule { };
