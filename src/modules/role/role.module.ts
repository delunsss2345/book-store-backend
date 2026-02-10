import { CacheProvider } from '@/config/redis.config';
import { RoleRepository } from '@/modules/role/role.repository';
import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

@Module({
  imports: [CacheProvider],
  controllers: [RoleController],
  providers: [RoleService, RoleRepository],
  exports: [RoleService]
})
export class RoleModule { }
