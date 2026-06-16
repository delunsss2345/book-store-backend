import { Module } from '@nestjs/common';
import { UserAddressController } from './controller/user-address.controller';
import { UserAddressRepository } from './repository/user-address.repository';
import { UserRoleRepository } from './repository/user-role.repository';
import { UserAddressService } from './service/user-address.service';
import { UserRoleService } from './service/user-role.service';

@Module({
    controllers: [UserAddressController],
    providers: [
        UserAddressService,
        UserAddressRepository,
        UserRoleService,
        UserRoleRepository,
    ],
    exports: [
        UserAddressService,
        UserAddressRepository,
        UserRoleService,
        UserRoleRepository,
    ],
})
export class UserModule { };
