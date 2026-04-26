import { CacheProvider } from '@/config/redis.config';
import { RolePermissionModule } from '@/modules/role-permission/role-permission.module';
import { UserRoleModule } from '@/modules/user-role/user-role.module';
import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierRepository } from './supplier.repository';
import { SupplierService } from './supplier.service';

@Module({
  imports: [RolePermissionModule, UserRoleModule, CacheProvider],
  controllers: [SupplierController],
  providers: [SupplierService, SupplierRepository],
  exports: [SupplierService, SupplierRepository],
})
export class SupplierModule { }
