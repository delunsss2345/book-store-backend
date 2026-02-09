import { Module } from '@nestjs/common';
import { UserRoleRepository } from './user-role.repository';
import { UserRoleService } from './user-role.service';

@Module({
    providers: [UserRoleService, UserRoleRepository],
    exports: [UserRoleService, UserRoleRepository],
})
export class UserRoleModule { }
