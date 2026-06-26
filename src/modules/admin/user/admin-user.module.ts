import { CacheProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { AdminUserController } from './controller/admin-user.controller';
import { AdminUserRepository } from './repository/admin-user.repository';
import { AdminUserService } from './service/admin-user.service';

@Module({
  imports: [CacheProvider],
  controllers: [AdminUserController],
  providers: [AdminUserService, AdminUserRepository],
  exports: [AdminUserService, AdminUserRepository],
})
export class AdminUserModule { }
