import { CacheProvider } from '@/config/redis.config';
import { AdminPurchaseOrderModule } from '@/modules/admin/purchase-order/admin-purchase-order.module';
import { Module } from '@nestjs/common';
import { AdminBookVariantController } from './controller/admin-book-variants.controller';
import { AdminBookVariantsRepository } from './repository/admin-book-variant.repository';
import { AdminBookVariantsService } from './service/admin-book-variant.service';

@Module({
  imports: [CacheProvider, AdminPurchaseOrderModule],
  controllers: [AdminBookVariantController],
  providers: [AdminBookVariantsService, AdminBookVariantsRepository],
  exports: [AdminBookVariantsService, AdminBookVariantsRepository],
})
export class AdminBookVariantModule { }
