import { CacheProvider } from '@/config/redis.config';
import { RoleModule } from '@/modules/role/role.module';
import { UserModule } from '@/modules/user/user.module';
import { Module } from '@nestjs/common';
import { SupplierController } from './controller/supplier.controller';
import { SupplierRepository } from './repository/supplier.repository';
import { SupplierService } from './service/supplier.service';

@Module({
  imports: [RoleModule, UserModule, CacheProvider],
  controllers: [SupplierController],
  providers: [SupplierService, SupplierRepository],
  exports: [SupplierService, SupplierRepository],
})
export class SupplierModule { }
