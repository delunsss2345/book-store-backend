import { CacheProvider } from '@/config/redis.config';
import { RoleModule } from '@/modules/role/role.module';
import { UserModule } from '@/modules/user/user.module';
import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierRepository } from './supplier.repository';
import { SupplierService } from './supplier.service';

@Module({
  imports: [RoleModule, UserModule, CacheProvider],
  controllers: [SupplierController],
  providers: [SupplierService, SupplierRepository],
  exports: [SupplierService, SupplierRepository],
})
export class SupplierModule { }
